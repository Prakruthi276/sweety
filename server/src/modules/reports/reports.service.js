const prisma = require('../../lib/prisma');
const { toDbDate, firstOfMonth, previousMonthRange, formatRangeLabel } = require('../../lib/dates');
const { toDto } = require('../readings/readings.service');

const REPORTS = {
  daily: { title: 'Daily report', range: (date) => ({ from: date, to: date }) },
  'month-to-date': { title: 'Month-to-date report', range: (date) => ({ from: firstOfMonth(date), to: date }) },
  monthly: { title: 'Previous month report', range: (date) => previousMonthRange(date) },
};

// Round half up to 1 decimal using integers only: round(sum * 10 / count)
const roundAverage = (sum, count) => Math.floor((sum * 20 + count) / (2 * count)) / 10;

async function getReport(userId, type, date) {
  const { title, range } = REPORTS[type];
  const { from, to } = range(date);
  const where = { userId, date: { gte: toDbDate(from), lte: toDbDate(to) } };

  const queries = [
    prisma.reading.aggregate({
      where,
      _count: { _all: true },
      _sum: { value: true },
      _max: { value: true },
      _min: { value: true },
    }),
  ];
  // Only the daily report lists the readings; one transaction gives both a consistent snapshot
  if (type === 'daily') queries.push(prisma.reading.findMany({ where, orderBy: { slot: 'asc' } }));
  const [agg, rows] = await prisma.$transaction(queries);

  const count = agg._count._all;
  const stats =
    count === 0
      ? { count: 0, highest: null, lowest: null, average: null }
      : { count, highest: agg._max.value, lowest: agg._min.value, average: roundAverage(agg._sum.value, count) };

  return {
    type,
    title,
    label: formatRangeLabel(from, to),
    selectedDate: date,
    range: { from, to },
    empty: count === 0,
    stats,
    ...(rows && { readings: rows.map(toDto) }),
  };
}

module.exports = { getReport, roundAverage };
