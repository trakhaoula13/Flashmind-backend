const router = require('express').Router();
const { protect } = require('../middleware/auth');
const folders = require('../controllers/folderController');
const cards = require('../controllers/cardController');

router.use(protect);

router.route('/').get(folders.list).post(folders.create);
router.route('/:id').get(folders.getOne).put(folders.update).delete(folders.remove);
router.route('/:folderId/cards').get(cards.listByFolder).post(cards.createInFolder);
router.post('/:folderId/cards/import', cards.importCards);

module.exports = router;
