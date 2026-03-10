require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'smelite_hajj',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Export pool for use in routes
module.exports.pool = pool;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================
// GENERIC CRUD API (replaces Supabase PostgREST)
// ============================================================

// GET /api/rest/:table - Select rows with filters
app.get('/api/rest/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const { select, order, limit, offset, ...filters } = req.query;

    let columns = select || '*';
    let query = `SELECT ${columns} FROM public."${table}"`;
    const values = [];
    const conditions = [];

    // Parse filters (eq, neq, gt, lt, like, in, is)
    Object.entries(filters).forEach(([key, value]) => {
      if (key.endsWith('.eq')) {
        const col = key.replace('.eq', '');
        values.push(value);
        conditions.push(`"${col}" = $${values.length}`);
      } else if (key.endsWith('.neq')) {
        const col = key.replace('.neq', '');
        values.push(value);
        conditions.push(`"${col}" != $${values.length}`);
      } else if (key.endsWith('.is')) {
        const col = key.replace('.is', '');
        conditions.push(`"${col}" IS ${value === 'null' ? 'NULL' : 'NOT NULL'}`);
      } else if (key.endsWith('.in')) {
        const col = key.replace('.in', '');
        const items = value.replace(/[()]/g, '').split(',');
        const placeholders = items.map((_, i) => `$${values.length + i + 1}`);
        values.push(...items);
        conditions.push(`"${col}" IN (${placeholders.join(',')})`);
      } else {
        // Default eq
        values.push(value);
        conditions.push(`"${key}" = $${values.length}`);
      }
    });

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    if (order) {
      const parts = order.split('.');
      const col = parts[0];
      const dir = parts[1] === 'desc' ? 'DESC' : 'ASC';
      query += ` ORDER BY "${col}" ${dir}`;
    }

    if (limit) query += ` LIMIT ${parseInt(limit)}`;
    if (offset) query += ` OFFSET ${parseInt(offset)}`;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('GET error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/rest/:table - Insert row(s)
app.post('/api/rest/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const data = Array.isArray(req.body) ? req.body : [req.body];

    const results = [];
    for (const row of data) {
      const columns = Object.keys(row);
      const values = Object.values(row);
      const placeholders = values.map((_, i) => `$${i + 1}`);

      const query = `INSERT INTO public."${table}" (${columns.map(c => `"${c}"`).join(',')}) VALUES (${placeholders.join(',')}) RETURNING *`;
      const result = await pool.query(query, values);
      results.push(result.rows[0]);
    }

    res.status(201).json(results.length === 1 ? results[0] : results);
  } catch (error) {
    console.error('POST error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/rest/:table - Update rows
app.patch('/api/rest/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const { ...filters } = req.query;
    const updates = req.body;

    const setClauses = [];
    const values = [];

    Object.entries(updates).forEach(([key, value]) => {
      values.push(value);
      setClauses.push(`"${key}" = $${values.length}`);
    });

    let query = `UPDATE public."${table}" SET ${setClauses.join(', ')}`;
    const conditions = [];

    Object.entries(filters).forEach(([key, value]) => {
      if (key.endsWith('.eq')) {
        const col = key.replace('.eq', '');
        values.push(value);
        conditions.push(`"${col}" = $${values.length}`);
      }
    });

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' RETURNING *';
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('PATCH error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/rest/:table - Delete rows
app.delete('/api/rest/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const { ...filters } = req.query;
    const values = [];
    const conditions = [];

    Object.entries(filters).forEach(([key, value]) => {
      if (key.endsWith('.eq')) {
        const col = key.replace('.eq', '');
        values.push(value);
        conditions.push(`"${col}" = $${values.length}`);
      }
    });

    let query = `DELETE FROM public."${table}"`;
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' RETURNING *';
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('DELETE error:', error);
    res.status(500).json({ error: error.message });
  }
});

// RPC endpoint (call database functions)
app.post('/api/rpc/:functionName', async (req, res) => {
  try {
    const { functionName } = req.params;
    const params = req.body;
    const paramKeys = Object.keys(params);
    
    if (paramKeys.length === 0) {
      const result = await pool.query(`SELECT public."${functionName}"() as result`);
      res.json(result.rows[0]?.result);
    } else {
      const values = Object.values(params);
      const placeholders = paramKeys.map((k, i) => `$${i + 1}::text`);
      const result = await pool.query(
        `SELECT public."${functionName}"(${placeholders.join(',')}) as result`,
        values
      );
      res.json(result.rows[0]?.result);
    }
  } catch (error) {
    console.error('RPC error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// EDGE FUNCTION REPLACEMENTS
// ============================================================

// Import route modules
const authRoutes = require('./api/auth');
const adminRoutes = require('./api/admin-users');
const paymentSSLRoutes = require('./api/payment-sslcommerz');
const paymentBkashRoutes = require('./api/payment-bkash');
const paymentNagadRoutes = require('./api/payment-nagad');
const notificationRoutes = require('./api/notifications');
const backupRoutes = require('./api/backup-restore');

app.use('/api/auth', authRoutes);
app.use('/api/admin-users', adminRoutes);
app.use('/api/payment-sslcommerz', paymentSSLRoutes);
app.use('/api/payment-bkash', paymentBkashRoutes);
app.use('/api/payment-nagad', paymentNagadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/backup-restore', backupRoutes);

// File upload endpoint (replaces Supabase Storage)
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const bucket = req.params.bucket || 'uploads';
    const dir = path.join(__dirname, 'uploads', bucket);
    require('fs').mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

app.post('/api/storage/:bucket/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.params.bucket}/${req.file.filename}`;
  res.json({
    path: `${req.params.bucket}/${req.file.filename}`,
    url: fileUrl,
    filename: req.file.filename,
    size: req.file.size,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`SM Elite Hajj Backend running on port ${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
});
