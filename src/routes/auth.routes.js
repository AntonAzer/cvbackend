const router = require('express').Router();
const { signup, login, me, forgotPassword } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/me', requireAuth, me);

module.exports = router;
