const service = require('./reports.service');

// One factory makes all three handlers
const handler = (type) => async (req, res) => {
  const report = await service.getReport(req.userId, type, req.validated.query.date);
  res.json({ report });
};

exports.daily = handler('daily');
exports.monthToDate = handler('month-to-date');
exports.monthly = handler('monthly');
