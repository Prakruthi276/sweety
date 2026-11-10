const { z } = require('zod');
const { isValidDateString, todayString } = require('../../lib/dates');

const reportQuerySchema = z.object({
  date: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => v === undefined || isValidDateString(v),
      'Date must be a valid date in YYYY-MM-DD format.'
    )
    .refine(
      (v) => v === undefined || !isValidDateString(v) || v <= todayString(),
      'Date cannot be in the future.'
    )
    .transform((v) => v ?? todayString()), // computed per request, so it never goes stale after midnight
});

module.exports = { reportQuerySchema };
