const { z } = require('zod');
const { SLOTS, MIN_VALUE, MAX_VALUE } = require('./readings.constants');
const { isValidDateString, todayString } = require('../../lib/dates');

const glucoseValue = z
  .custom((v) => v !== undefined && v !== null && v !== '', 'Please enter a glucose value.')
  .transform((v) => (typeof v === 'string' ? Number(v) : v))
  .refine(
    (n) => Number.isInteger(n) && n >= MIN_VALUE && n <= MAX_VALUE,
    `Value must be between ${MIN_VALUE} and ${MAX_VALUE} mg/dl.`
  );

const slot = z.custom((v) => SLOTS.includes(v), 'Please choose a time slot.');

const date = z
  .custom((v) => typeof v === 'string' && v.trim() !== '', 'Please select a date.')
  .refine(isValidDateString, 'Date must be a valid date in YYYY-MM-DD format.')
  .refine((v) => !isValidDateString(v) || v <= todayString(), 'Date cannot be in the future.');

const readingSchema = z.object({ date, slot, value: glucoseValue });

const listQuerySchema = z.object({
  date: z
    .string()
    .optional()
    .refine(
      (v) => v === undefined || isValidDateString(v),
      'Date must be a valid date in YYYY-MM-DD format.'
    ),
  page: z.coerce.number().int('page must be a whole number').min(1, 'page must be 1 or more').default(1),
  limit: z.coerce
    .number()
    .int('limit must be a whole number')
    .min(1, 'limit must be 1 or more')
    .max(100, 'limit cannot be more than 100')
    .default(20),
});

module.exports = { readingSchema, listQuerySchema };
