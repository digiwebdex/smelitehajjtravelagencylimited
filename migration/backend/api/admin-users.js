const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { verifyToken, verifyAdmin, pool } = require('./auth');

// POST /api/admin-users/create-admin
router.post('/create-admin', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (email, encrypted_password, full_name, email_confirmed_at, raw_user_meta_data)
       VALUES ($1, $2, $3, NOW(), $4) RETURNING id`,
      [email, hashedPassword, full_name || email, JSON.stringify({ full_name: full_name || email })]
    );

    // Update profile to admin
    await pool.query('UPDATE profiles SET role = $1 WHERE id = $2', ['admin', rows[0].id]);

    res.json({ success: true, user_id: rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin-users/create-staff
router.post('/create-staff', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { email, password, full_name, role, department, phone } = req.body;

    const hashedPassword = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (email, encrypted_password, full_name, email_confirmed_at, raw_user_meta_data)
       VALUES ($1, $2, $3, NOW(), $4) RETURNING id`,
      [email, hashedPassword, full_name, JSON.stringify({ full_name, phone })]
    );

    const userId = rows[0].id;

    // Create staff member record
    await pool.query(
      `INSERT INTO staff_members (user_id, staff_name, role, department, phone, is_active)
       VALUES ($1, $2, $3, $4, $5, true)`,
      [userId, full_name, role || 'support', department, phone]
    );

    res.json({ success: true, user_id: userId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin-users/create-demo
router.post('/create-demo', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;

    const hashedPassword = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (email, encrypted_password, full_name, email_confirmed_at, raw_user_meta_data)
       VALUES ($1, $2, $3, NOW(), $4) RETURNING id
       ON CONFLICT (email) DO UPDATE SET encrypted_password = $2 RETURNING id`,
      [email, hashedPassword, full_name, JSON.stringify({ full_name })]
    );

    await pool.query('UPDATE profiles SET role = $1 WHERE id = $2', [role || 'viewer', rows[0].id]);
    res.json({ success: true, user_id: rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin-users/update-password
router.post('/update-password', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET encrypted_password = $1 WHERE id = $2', [hashedPassword, userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
