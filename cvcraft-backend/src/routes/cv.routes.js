const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { listCVs, getCV, createCV, updateCV, deleteCV } = require('../controllers/cv.controller');

router.use(requireAuth);
router.get('/', listCVs);
router.get('/:id', getCV);
router.post('/', createCV);
router.put('/:id', updateCV);
router.delete('/:id', deleteCV);

module.exports = router;
