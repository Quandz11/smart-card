const LibraryLoan = require('../models/LibraryLoan');
const Card = require('../models/Card');
const User = require('../models/User');
const cardService = require('./cardService');
const logService = require('./logService');
const { withIdempotency } = require('../utils/idempotency');

/**
 * Borrow a book using student's card.
 * INV-06: Maximum 3 active loans with status "borrowed".
 */
const borrowBook = async (body, userOrId) => {
  const { cardCode, bookCode, bookTitle, qrType, idempotencyKey } = body || {};

  // Check type mismatch
  if (qrType && qrType !== 'BOOK') {
    const error = new Error('Mã QR không dùng cho chức năng này');
    error.statusCode = 400;
    throw error;
  }

  let user = null;
  if (userOrId && typeof userOrId === 'object' && userOrId._id) {
    user = userOrId;
  } else if (userOrId) {
    user = await User.findById(userOrId);
  }
  const createdBy = user ? user._id : userOrId;

  const executeBorrow = async () => {
    if (!bookCode) {
      const error = new Error('bookCode is required');
      error.statusCode = 400;
      throw error;
    }

    let card;
    if (user && user.role === 'student' && !cardCode) {
      card = await Card.findOne({ owner: user._id, status: 'active' });
      if (!card) {
        const error = new Error('Thẻ sinh viên không khả dụng');
        error.statusCode = 403;
        throw error;
      }
      await cardService.assertCardUsable(card);
    } else {
      if (!cardCode) {
        const error = new Error('cardCode, bookCode, and bookTitle are required');
        error.statusCode = 400;
        throw error;
      }
      card = await cardService.resolveCard({ cardCode });
    }

    // Resolve bookTitle if omitted
    let finalTitle = bookTitle;
    if (!finalTitle) {
      const existingLoan = await LibraryLoan.findOne({ bookCode: bookCode.trim() });
      finalTitle = existingLoan ? existingLoan.bookTitle : `Sách ${bookCode.trim()}`;
    }

    // INV-06: One student has AT MOST 3 LibraryLoans with status="borrowed"
    const activeLoansCount = await LibraryLoan.countDocuments({
      borrower: card.owner,
      status: 'borrowed',
    });

    if (activeLoansCount >= 3) {
      const error = new Error('Borrow limit reached: maximum 3 active borrowed books allowed');
      error.statusCode = 400;
      throw error;
    }

    const borrowedAt = new Date();
    const dueAt = new Date(borrowedAt.getTime() + 14 * 24 * 60 * 60 * 1000); // +14 days

    const loan = await LibraryLoan.create({
      borrower: card.owner,
      bookCode: bookCode.trim(),
      bookTitle: finalTitle.trim(),
      borrowedAt,
      dueAt,
      status: 'borrowed',
    });

    // INV-04: Write AccessLog
    await logService.recordLog({
      card: card._id,
      owner: card.owner,
      action: 'library_borrow',
      location: 'Library',
      detail: `Borrowed "${finalTitle}" (${bookCode})`,
      createdBy,
    });

    try {
      const notificationService = require('./notificationService');
      const { formatDate } = require('../constants/notificationCatalog');
      await notificationService.createAndDispatch({
        type: 'BOOK_BORROWED',
        audience: 'individual',
        receiver: card.owner,
        actor: createdBy,
        relatedType: 'BookLoan',
        relatedId: loan._id,
        templateData: {
          bookTitle: loan.bookTitle,
          dueDate: formatDate(dueAt),
        },
      });
    } catch (e) {}

    return loan;
  };

  if (idempotencyKey) {
    return withIdempotency(idempotencyKey, executeBorrow);
  }
  return executeBorrow();
};

/**
 * Return a book. Checks overdue status.
 */
const returnBook = async ({ loanId, cardCode, bookCode }, createdBy) => {
  let loan;

  if (loanId) {
    loan = await LibraryLoan.findById(loanId);
  } else if (cardCode && bookCode) {
    const card = await cardService.resolveCard({ cardCode });
    loan = await LibraryLoan.findOne({
      borrower: card.owner,
      bookCode: bookCode.trim(),
      status: 'borrowed',
    });
  } else {
    const error = new Error('Either loanId or (cardCode and bookCode) must be provided');
    error.statusCode = 400;
    throw error;
  }

  if (!loan) {
    const error = new Error('Active loan not found');
    error.statusCode = 404;
    throw error;
  }

  const now = new Date();
  const isOverdue = now > new Date(loan.dueAt);

  loan.returnedAt = now;
  loan.status = 'returned';
  await loan.save();

  // Find card for AccessLog
  const card = await Card.findOne({ owner: loan.borrower, status: 'active' });

  // INV-04: Write AccessLog
  await logService.recordLog({
    card: card ? card._id : null,
    owner: loan.borrower,
    action: 'library_return',
    location: 'Library',
    detail: `Returned "${loan.bookTitle}" (${loan.bookCode})${isOverdue ? ' [OVERDUE]' : ''}`,
    createdBy,
  });

  try {
    const notificationService = require('./notificationService');
    await notificationService.createAndDispatch({
      type: 'BOOK_RETURNED',
      audience: 'individual',
      receiver: loan.borrower,
      actor: createdBy,
      relatedType: 'BookLoan',
      relatedId: loan._id,
      templateData: {
        bookTitle: loan.bookTitle,
      },
    });
  } catch (e) {}

  return {
    loan,
    overdue: isOverdue,
  };
};

/**
 * Get current student's loans with optional status filter.
 */
const getMyLoans = async (studentId, status) => {
  const query = { borrower: studentId };
  if (status) {
    query.status = status;
  }
  return LibraryLoan.find(query).sort({ borrowedAt: -1 });
};

/**
 * Get all library loans with pagination (Admin/Librarian).
 */
const getAllLoans = async ({ page = 1, limit = 20, status }) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (status) query.status = status;

  const [data, total] = await Promise.all([
    LibraryLoan.find(query)
      .populate('borrower', 'fullName email studentCode className')
      .sort({ borrowedAt: -1 })
      .skip(skip)
      .limit(limitNum),
    LibraryLoan.countDocuments(query),
  ]);

  return {
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
    },
  };
};

module.exports = {
  borrowBook,
  returnBook,
  getMyLoans,
  getAllLoans,
};

