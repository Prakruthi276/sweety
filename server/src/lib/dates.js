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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parts = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return { y, m, d };
};
const toYmd = (date) => date.toISOString().slice(0, 10);

const firstOfMonth = (s) => `${s.slice(0, 7)}-01`;

// Whole month before the month of `s`. Date.UTC rolls January back to December,
// and day 0 of a month means "the last day of the month before".
const previousMonthRange = (s) => {
  const { y, m } = parts(s);
  return {
    from: toYmd(new Date(Date.UTC(y, m - 2, 1))),
    to: toYmd(new Date(Date.UTC(y, m - 1, 0))),
  };
};

const formatDateLabel = (s) => {
  const { y, m, d } = parts(s);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

// "15 Oct 2026" for one day, "1 Oct – 15 Oct 2026" for a range
const formatRangeLabel = (from, to) => {
  if (from === to) return formatDateLabel(to);
  const a = parts(from);
  const b = parts(to);
  const start = a.y === b.y ? `${a.d} ${MONTHS[a.m - 1]}` : formatDateLabel(from);
  return `${start} \u2013 ${formatDateLabel(to)}`;
};

module.exports = {
  todayString, isValidDateString, toDbDate, fromDbDate,
  firstOfMonth, previousMonthRange, formatDateLabel, formatRangeLabel,
};
