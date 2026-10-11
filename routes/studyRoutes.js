const router = require('express').Router();
const { protect } = require('../middleware/auth');
const study = require('../controllers/studyController');

router.use(protect);

router.get('/due', study.due);
router.get('/stats', study.stats);

module.exports = router;
