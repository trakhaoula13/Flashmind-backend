const router = require('express').Router();
const { protect } = require('../middleware/auth');
const cards = require('../controllers/cardController');

router.use(protect);

router.route('/:id').put(cards.update).delete(cards.remove);
router.post('/:id/review', cards.review);

module.exports = router;
