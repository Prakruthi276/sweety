const prisma = require('../../lib/prisma');
const AppError = require('../../lib/AppError');
const { toDbDate, fromDbDate } = require('../../lib/dates');
const { SLOT_LABELS, MAX_PER_DAY } = require('./readings.constants');

const toDto = (r) => ({
  id: r.id,
  date: fromDbDate(r.date),
  slot: r.slot,
  slotLabel: SLOT_LABELS[r.slot],
  value: r.value,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

const article = (label) => (/^[aeiou]/i.test(label) ? 'an' : 'a');

const duplicateError = (slot) => {
  const label = SLOT_LABELS[slot];
  return new AppError(409, `You already have ${article(label)} ${label} reading for this date.`);
};
const dayFullError = () => new AppError(409, `You can add only ${MAX_PER_DAY} readings per day.`);

async function create(userId, { date, slot, value }) {
  const day = toDbDate(date);

  const count = await prisma.reading.count({ where: { userId, date: day } });
  if (count >= MAX_PER_DAY) throw dayFullError();

  try {
    return toDto(await prisma.reading.create({ data: { userId, date: day, slot, value } }));
  } catch (err) {
    // Unique (userId, date, slot) violated: also covers two simultaneous requests
    if (err.code === 'P2002') throw duplicateError(slot);
    throw err;
  }
}

async function list(userId, { date, page, limit }) {
  const where = { userId, ...(date && { date: toDbDate(date) }) };
  const [rows, total] = await prisma.$transaction([
    prisma.reading.findMany({
      where,
      orderBy: [{ date: 'desc' }, { slot: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.reading.count({ where }),
  ]);
  return {
    data: rows.map(toDto),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function getOne(userId, id) {
  // Filtering by userId means someone else's reading looks like "not found"
  const reading = await prisma.reading.findFirst({ where: { id, userId } });
  if (!reading) throw new AppError(404, 'Reading not found');
  return toDto(reading);
}

async function update(userId, id, { date, slot, value }) {
  const existing = await prisma.reading.findFirst({ where: { id, userId } });
  if (!existing) throw new AppError(404, 'Reading not found');

  const day = toDbDate(date);
  if (day.getTime() !== existing.date.getTime()) {
    const count = await prisma.reading.count({ where: { userId, date: day } });
    if (count >= MAX_PER_DAY) throw dayFullError();
  }

  try {
    return toDto(await prisma.reading.update({ where: { id }, data: { date: day, slot, value } }));
  } catch (err) {
    if (err.code === 'P2002') throw duplicateError(slot);
    throw err;
  }
}

async function remove(userId, id) {
  const { count } = await prisma.reading.deleteMany({ where: { id, userId } });
  if (count === 0) throw new AppError(404, 'Reading not found');
}

module.exports = { create, list, getOne, update, remove };
