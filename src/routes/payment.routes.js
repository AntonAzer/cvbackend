const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const {
  createPendingPayment,
  confirmPayment,
  listPayments
} = require('../controllers/payment.controller');

router.use(requireAuth);
router.get('/', listPayments);
router.post('/', createPendingPayment);
router.post('/:id/confirm', confirmPayment);

module.exports = router;
