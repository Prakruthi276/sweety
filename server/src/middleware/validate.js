const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const seen = new Set();
    const errors = [];
    for (const issue of result.error.issues) {
      const field = issue.path.join('.');
      if (seen.has(field)) continue; // one message per field
      seen.add(field);
      errors.push({ field, message: issue.message });
    }
    return res.status(400).json({ message: 'Validation failed', errors });
  }
  if (source === 'body') req.body = result.data;
  else req.validated = { ...req.validated, [source]: result.data }; // req.query is read-only in Express 5
  next();
};
module.exports = validate;
