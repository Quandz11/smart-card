const express = require('express');
const libraryController = require('../controllers/libraryController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/borrow', authorize('admin', 'librarian', 'student'), libraryController.borrowBook);
router.post('/return', authorize('admin', 'librarian', 'student'), libraryController.returnBook);
router.get('/my-loans', authorize('student'), libraryController.getMyLoans);
router.get('/loans', authorize('admin', 'librarian'), libraryController.getAllLoans);

module.exports = router;

