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

// bKash payment routes - mirrors edge function logic
router.post('/initiate', async (req, res) => {
  try {
    const { bookingId, amount, callbackUrl } = req.body;

    const { rows: [paymentMethod] } = await pool.query(
      `SELECT credentials, is_live_mode FROM payment_methods WHERE slug = 'bkash' LIMIT 1`
    );
    if (!paymentMethod) throw new Error('bKash not configured');

    const creds = paymentMethod.credentials;
    const isLive = paymentMethod.is_live_mode;
    const baseUrl = isLive ? 'https://tokenized.pay.bka.sh/v1.2.0-beta' : 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';

    // Get token
    const tokenResponse = await fetch(`${baseUrl}/tokenized/checkout/token/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        username: creds.username,
        password: creds.password,
      },
      body: JSON.stringify({ app_key: creds.app_key, app_secret: creds.app_secret }),
    });
    const tokenResult = await tokenResponse.json();

    if (!tokenResult.id_token) throw new Error('Failed to get bKash token');

    // Create payment
    const paymentResponse = await fetch(`${baseUrl}/tokenized/checkout/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: tokenResult.id_token,
        'X-APP-Key': creds.app_key,
      },
      body: JSON.stringify({
        mode: '0011',
        payerReference: bookingId,
        callbackURL: callbackUrl,
        amount: amount.toString(),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: `INV-${bookingId.slice(0, 8)}`,
      }),
    });
    const paymentResult = await paymentResponse.json();

    res.json(paymentResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/execute', async (req, res) => {
  try {
    const { paymentID, bookingId } = req.body;

    const { rows: [paymentMethod] } = await pool.query(
      `SELECT credentials, is_live_mode FROM payment_methods WHERE slug = 'bkash' LIMIT 1`
    );
    const creds = paymentMethod.credentials;
    const isLive = paymentMethod.is_live_mode;
    const baseUrl = isLive ? 'https://tokenized.pay.bka.sh/v1.2.0-beta' : 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';

    // Get fresh token
    const tokenResponse = await fetch(`${baseUrl}/tokenized/checkout/token/grant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', username: creds.username, password: creds.password },
      body: JSON.stringify({ app_key: creds.app_key, app_secret: creds.app_secret }),
    });
    const tokenResult = await tokenResponse.json();

    const executeResponse = await fetch(`${baseUrl}/tokenized/checkout/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: tokenResult.id_token,
        'X-APP-Key': creds.app_key,
      },
      body: JSON.stringify({ paymentID }),
    });
    const executeResult = await executeResponse.json();

    if (executeResult.transactionStatus === 'Completed') {
      await pool.query(
        `UPDATE bookings SET payment_status = 'paid', transaction_id = $1 WHERE id = $2`,
        [executeResult.trxID, bookingId]
      );
    }

    res.json(executeResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
