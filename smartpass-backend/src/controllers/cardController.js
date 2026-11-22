const cardService = require('../services/cardService');

const createCard = async (req, res, next) => {
  try {
    const card = await cardService.createCard(req.body);
    res.status(201).json({
      success: true,
      data: card,
    });
  } catch (error) {
    next(error);
  }
};

const getCards = async (req, res, next) => {
  try {
    const result = await cardService.getCards({
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

const getCardById = async (req, res, next) => {
  try {
    const card = await cardService.getCardById(req.params.id, req.user);
    res.status(200).json({
      success: true,
      data: card,
    });
  } catch (error) {
    next(error);
  }
};

const issueCard = async (req, res, next) => {
  try {
    const card = await cardService.issueCard(req.params.id);
    res.status(200).json({
      success: true,
      data: card,
    });
  } catch (error) {
    next(error);
  }
};

const lockCard = async (req, res, next) => {
  try {
    const card = await cardService.lockCard(req.params.id);
    res.status(200).json({
      success: true,
      data: card,
    });
  } catch (error) {
    next(error);
  }
};

const unlockCard = async (req, res, next) => {
  try {
    const card = await cardService.unlockCard(req.params.id);
    res.status(200).json({
      success: true,
      data: card,
    });
  } catch (error) {
    next(error);
  }
};

const renewCard = async (req, res, next) => {
  try {
    const card = await cardService.renewCard(req.params.id, req.body.months);
    res.status(200).json({
      success: true,
      data: card,
    });
  } catch (error) {
    next(error);
  }
};

const markCardLost = async (req, res, next) => {
  try {
    const card = await cardService.markCardLost(req.params.id, req.user);
    res.status(200).json({
      success: true,
      data: card,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCard = async (req, res, next) => {
  try {
    const result = await cardService.deleteCard(req.params.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getCardHistory = async (req, res, next) => {
  try {
    const result = await cardService.getCardHistory(
      req.params.id,
      req.user,
      req.query.page,
      req.query.limit
    );
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const verifyCard = async (req, res, next) => {
  try {
    const result = await cardService.verifyCard(req.body);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCard,
  getCards,
  getCardById,
  issueCard,
  lockCard,
  unlockCard,
  renewCard,
  markCardLost,
  deleteCard,
  getCardHistory,
  verifyCard,
};

