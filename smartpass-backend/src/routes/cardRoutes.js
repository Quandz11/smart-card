const express = require('express');
const cardController = require('../controllers/cardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/verify', cardController.verifyCard);

router.post('/', authorize('admin'), cardController.createCard);
router.get('/', authorize('admin'), cardController.getCards);

router.get('/:id', cardController.getCardById);
router.patch('/:id/issue', authorize('admin'), cardController.issueCard);
router.patch('/:id/lock', authorize('admin'), cardController.lockCard);
router.patch('/:id/unlock', authorize('admin'), cardController.unlockCard);
router.patch('/:id/renew', authorize('admin'), cardController.renewCard);
router.patch('/:id/lost', cardController.markCardLost);
router.delete('/:id', authorize('admin'), cardController.deleteCard);
router.get('/:id/history', cardController.getCardHistory);

module.exports = router;

