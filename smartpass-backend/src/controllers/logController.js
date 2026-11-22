const logService = require('../services/logService');

const getLogs = async (req, res, next) => {
  try {
    const result = await logService.getLogs(
      {
        card: req.query.card,
        owner: req.query.owner,
        action: req.query.action,
        from: req.query.from,
        to: req.query.to,
      },
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

module.exports = {
  getLogs,
};

