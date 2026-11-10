const router = require('express').Router();
const c = require('./reports.controller');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const { reportQuerySchema } = require('./reports.schema');

router.use(authenticate);

router.get('/daily', validate(reportQuerySchema, 'query'), c.daily);
router.get('/month-to-date', validate(reportQuerySchema, 'query'), c.monthToDate);
router.get('/monthly', validate(reportQuerySchema, 'query'), c.monthly);

module.exports = router;
