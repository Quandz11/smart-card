const libraryService = require('../services/libraryService');

const borrowBook = async (req, res, next) => {
  try {
    const loan = await libraryService.borrowBook(req.body, req.user);
    res.status(201).json({
      success: true,
      data: loan,
    });
  } catch (error) {
    next(error);
  }
};

const returnBook = async (req, res, next) => {
  try {
    const result = await libraryService.returnBook(req.body, req.user);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMyLoans = async (req, res, next) => {
  try {
    const loans = await libraryService.getMyLoans(req.user._id, req.query.status);
    res.status(200).json({
      success: true,
      data: loans,
    });
  } catch (error) {
    next(error);
  }
};

const getAllLoans = async (req, res, next) => {
  try {
    const result = await libraryService.getAllLoans({
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
    });
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  borrowBook,
  returnBook,
  getMyLoans,
  getAllLoans,
};

