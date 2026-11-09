const router = require('express').Router();
const c = require('./readings.controller');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const { readingSchema, listQuerySchema } = require('./readings.schema');

router.use(authenticate); // every readings route needs a valid access token

router.get('/', validate(listQuerySchema, 'query'), c.list);
router.post('/', validate(readingSchema), c.create);
router.get('/:id', c.getOne);
router.put('/:id', validate(readingSchema), c.update);
router.delete('/:id', c.remove);

module.exports = router;
