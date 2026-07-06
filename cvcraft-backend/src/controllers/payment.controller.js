const pool = require('../config/db');

// Called right before redirecting the user to PayPal, so there's a record
// even if they never come back / never complete the payment.
async function createPendingPayment(req, res) {
  try {
    const { cvId, amount = 1.0, providerOrderId } = req.body;
    const result = await pool.query(
      `insert into payments (user_id, cv_id, amount, provider, provider_order_id, status)
       values ($1, $2, $3, 'paypal', $4, 'pending')
       returning id, cv_id, amount, currency, status, created_at`,
      [req.user.id, cvId || null, amount, providerOrderId || null]
    );
    res.status(201).json({ payment: result.rows[0] });
  } catch (err) {
    console.error('createPendingPayment error', err);
    res.status(500).json({ error: 'Could not create payment record' });
  }
}

// IMPORTANT: In production, do not let the client just call "confirm" to mark
// itself as paid (that's what the original front-end-only version did with a
// `confirm()` dialog, and it's trivially fakeable). Instead:
//   - Use PayPal's Orders API + webhooks (PAYMENT.CAPTURE.COMPLETED) on the
//     backend, verify the webhook signature, and only then flip the status.
// This endpoint is left as a clearly-labeled placeholder for that webhook
// handler so the rest of the app (CV history, "download unlocked", etc.) has
// something to call during development.
async function confirmPayment(req, res) {
  try {
    const result = await pool.query(
      `update payments set status = 'completed'
       where id = $1 and user_id = $2
       returning id, cv_id, amount, currency, status, created_at`,
      [req.params.id, req.user.id]
    );
    const payment = result.rows[0];
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json({ payment });
  } catch (err) {
    console.error('confirmPayment error', err);
    res.status(500).json({ error: 'Could not confirm payment' });
  }
}

async function listPayments(req, res) {
  try {
    const result = await pool.query(
      'select id, cv_id, amount, currency, status, created_at from payments where user_id = $1 order by created_at desc',
      [req.user.id]
    );
    res.json({ payments: result.rows });
  } catch (err) {
    console.error('listPayments error', err);
    res.status(500).json({ error: 'Could not load payment history' });
  }
}

module.exports = { createPendingPayment, confirmPayment, listPayments };
