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

async function getSSLCommerzConfig() {
  const { rows } = await pool.query(
    `SELECT credentials, is_live_mode FROM payment_methods WHERE slug = 'sslcommerz' LIMIT 1`
  );
  if (!rows[0]) throw new Error('SSLCommerz not configured');

  const creds = rows[0].credentials;
  const isLive = rows[0].is_live_mode;
  const storeId = isLive ? creds.store_id : (creds.test_store_id || creds.store_id);
  const storePassword = isLive ? creds.store_password : (creds.test_store_password || creds.store_password);

  return {
    storeId, storePassword,
    apiUrl: isLive ? 'https://securepay.sslcommerz.com' : 'https://sandbox.sslcommerz.com',
    isLive,
  };
}

// POST /api/payment-sslcommerz/initiate
router.post('/initiate', async (req, res) => {
  try {
    const { bookingId, successUrl, failUrl, cancelUrl, amount, installmentId } = req.body;
    const config = await getSSLCommerzConfig();

    const { rows: [booking] } = await pool.query(
      `SELECT b.*, p.title as package_title FROM bookings b JOIN packages p ON b.package_id = p.id WHERE b.id = $1`,
      [bookingId]
    );
    if (!booking) throw new Error('Booking not found');

    const paymentAmount = amount || booking.total_price;
    const transactionId = `BOOKING_${booking.id}_${Date.now()}`;
    const ipnUrl = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/payment-sslcommerz/ipn`;

    const sslPayload = new URLSearchParams({
      store_id: config.storeId,
      store_passwd: config.storePassword,
      total_amount: paymentAmount.toString(),
      currency: 'BDT',
      tran_id: transactionId,
      success_url: successUrl,
      fail_url: failUrl,
      cancel_url: cancelUrl,
      ipn_url: ipnUrl,
      cus_name: booking.guest_name || 'Customer',
      cus_email: booking.guest_email || 'customer@example.com',
      cus_phone: booking.guest_phone || '01700000000',
      cus_add1: 'Bangladesh',
      cus_city: 'Dhaka',
      cus_country: 'Bangladesh',
      shipping_method: 'NO',
      product_name: booking.package_title || 'Package Booking',
      product_category: 'Travel',
      product_profile: 'non-physical-goods',
      value_a: booking.id,
      value_b: installmentId || '',
    });

    const response = await fetch(`${config.apiUrl}/gwprocess/v4/api.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: sslPayload.toString(),
    });

    const result = await response.json();

    if (result.status === 'SUCCESS') {
      // Create transaction record
      await pool.query(
        `INSERT INTO transactions (booking_id, emi_installment_id, payment_method, gateway_name, transaction_id, amount, status, is_live_mode)
         VALUES ($1, $2, 'sslcommerz', 'SSLCommerz', $3, $4, 'initiated', $5)`,
        [bookingId, installmentId || null, transactionId, paymentAmount, config.isLive]
      );

      await pool.query(
        `UPDATE bookings SET transaction_id = $1, payment_status = 'initiated' WHERE id = $2`,
        [transactionId, bookingId]
      );

      res.json({ success: true, gatewayUrl: result.GatewayPageURL, transactionId });
    } else {
      res.status(400).json({ success: false, error: result.failedreason || 'Payment initiation failed' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/payment-sslcommerz/ipn
router.post('/ipn', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const { val_id, tran_id, status, value_a: bookingId, value_b: installmentId, amount } = req.body;
    if (!bookingId) return res.status(200).send('OK');

    const config = await getSSLCommerzConfig();
    const validationUrl = `${config.apiUrl}/validator/api/validationserverAPI.php?val_id=${val_id}&store_id=${config.storeId}&store_passwd=${config.storePassword}&format=json`;
    
    const validationResponse = await fetch(validationUrl);
    const validationResult = await validationResponse.json();

    let paymentStatus = 'failed';
    if (validationResult.status === 'VALID' || validationResult.status === 'VALIDATED') paymentStatus = 'paid';
    else if (status === 'PENDING') paymentStatus = 'pending';

    await pool.query(
      `UPDATE transactions SET status = $1, response_payload = $2, verified_at = $3 WHERE transaction_id = $4`,
      [paymentStatus, JSON.stringify(validationResult), paymentStatus === 'paid' ? new Date() : null, tran_id]
    );

    await pool.query(
      `UPDATE bookings SET payment_status = $1, transaction_id = $2 WHERE id = $3`,
      [paymentStatus, tran_id, bookingId]
    );

    if (installmentId && paymentStatus === 'paid') {
      await pool.query(
        `UPDATE emi_installments SET status = 'paid', paid_date = $1, transaction_id = $2, payment_method = 'sslcommerz' WHERE id = $3`,
        [new Date().toISOString(), tran_id, installmentId]
      );
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('IPN error:', error);
    res.status(200).send('OK');
  }
});

// POST /api/payment-sslcommerz/validate
router.post('/validate', async (req, res) => {
  try {
    const { valId, bookingId } = req.body;
    const config = await getSSLCommerzConfig();

    const validationUrl = `${config.apiUrl}/validator/api/validationserverAPI.php?val_id=${valId}&store_id=${config.storeId}&store_passwd=${config.storePassword}&format=json`;
    const response = await fetch(validationUrl);
    const result = await response.json();

    const isValid = result.status === 'VALID' || result.status === 'VALIDATED';

    if (isValid && bookingId) {
      await pool.query(`UPDATE bookings SET payment_status = 'paid' WHERE id = $1`, [bookingId]);
      await pool.query(
        `UPDATE transactions SET status = 'paid', verified_at = NOW() WHERE booking_id = $1 AND status = 'initiated'`,
        [bookingId]
      );
    }

    res.json({ success: isValid, status: result.status, amount: result.amount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
