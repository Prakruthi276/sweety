const env = require('../config/env');

// en-CA formats a date as YYYY-MM-DD
const todayString = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: env.APP_TIMEZONE }).format(new Date());

// Rejects bad formats and impossible dates like 2026-02-31
const isValidDateString = (s) => {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

const toDbDate = (s) => new Date(`${s}T00:00:00.000Z`);
const fromDbDate = (d) => d.toISOString().slice(0, 10);

module.exports = { todayString, isValidDateString, toDbDate, fromDbDate };
