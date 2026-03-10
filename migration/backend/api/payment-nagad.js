const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'smelite_hajj',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

// Nagad payment placeholder - implement based on Nagad Merchant API docs
router.post('/initiate', async (req, res) => {
  try {
    const { bookingId, amount, callbackUrl } = req.body;

    const { rows: [paymentMethod] } = await pool.query(
      `SELECT credentials, is_live_mode FROM payment_methods WHERE slug = 'nagad' LIMIT 1`
    );
    if (!paymentMethod) throw new Error('Nagad not configured');

    // Nagad API integration - same logic as edge function
    res.json({ message: 'Nagad integration - configure credentials in admin panel' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { paymentRefId, bookingId } = req.body;
    // Verification logic here
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
