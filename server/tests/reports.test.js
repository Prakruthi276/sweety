const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');
const { todayString } = require('../src/lib/dates');
const { roundAverage } = require('../src/modules/reports/reports.service');

const day = (s) => new Date(`${s}T00:00:00.000Z`);

async function signup(email) {
  const password = 'Password1';
  await request(app).post('/api/auth/register').send({ name: 'Reporter', email, password });
  const res = await request(app).post('/api/auth/login').send({ email, password });
  const user = await prisma.user.findUnique({ where: { email } });
  const token = res.body.accessToken;
  return {
    id: user.id,
    get: (url) => request(app).get(url).set('Authorization', `Bearer ${token}`),
    post: (url, body) => request(app).post(url).set('Authorization', `Bearer ${token}`).send(body),
    del: (url) => request(app).delete(url).set('Authorization', `Bearer ${token}`),
  };
}

const cleanup = () => prisma.user.deleteMany({ where: { email: { endsWith: '@test.com' } } });
const add = (userId, list) =>
  prisma.reading.createMany({
    data: list.map(([date, slot, value]) => ({ userId, date: day(date), slot, value })),
  });

let a; // has data
let b; // has one extreme reading, must never leak into a's reports
let empty; // has no data

beforeAll(async () => {
  await cleanup();
  a = await signup('reports-a@test.com');
  b = await signup('reports-b@test.com');
  empty = await signup('reports-empty@test.com');

  await add(a.id, [
    ['2025-12-01', 'MORNING_FASTING', 88],  // previous month of 2026-01-15
    ['2025-12-31', 'AFTER_DINNER', 77],
    ['2026-08-31', 'AFTER_DINNER', 500],    // just before September: must be excluded
    ['2026-09-01', 'MORNING_FASTING', 100], // first day of September: included
    ['2026-09-15', 'AFTER_LUNCH', 150],
    ['2026-09-30', 'AFTER_DINNER', 200],    // last day of September: included
    ['2026-10-01', 'MORNING_FASTING', 90],  // also just after September: excluded from monthly
    ['2026-10-10', 'AFTER_BREAKFAST', 120],
    ['2026-10-15', 'AFTER_DINNER', 131],    // inserted before MORNING to test ordering
    ['2026-10-15', 'MORNING_FASTING', 110],
    ['2026-10-16', 'MORNING_FASTING', 400], // after the selected date: excluded
  ]);
  await add(b.id, [['2026-10-15', 'MORNING_FASTING', 600]]);
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe('roundAverage', () => {
  it.each([
    [451, 4, 112.8], // 112.75 rounds half up
    [241, 2, 120.5],
    [450, 3, 150],
    [100, 3, 33.3],
    [20, 3, 6.7],
    [1, 8, 0.1],     // 0.125
  ])('sum %i over %i readings is %d', (sum, count, expected) => {
    expect(roundAverage(sum, count)).toBe(expected);
  });
});

describe('authentication and validation', () => {
  it.each(['daily', 'month-to-date', 'monthly'])('%s needs a token', async (type) => {
    expect((await request(app).get(`/api/reports/${type}`)).status).toBe(401);
  });

  it('defaults the selected date to today', async () => {
    const res = await a.get('/api/reports/daily');
    expect(res.status).toBe(200);
    expect(res.body.report.selectedDate).toBe(todayString());
    expect(res.body.report.range).toEqual({ from: todayString(), to: todayString() });
  });

  it('rejects a future date', async () => {
    const d = new Date(`${todayString()}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    const res = await a.get(`/api/reports/daily?date=${d.toISOString().slice(0, 10)}`);
    expect(res.status).toBe(400);
    expect(res.body.errors[0]).toEqual({ field: 'date', message: 'Date cannot be in the future.' });
  });

  it.each([['nope'], ['2026-02-31'], ['']])('rejects invalid date %p', async (date) => {
    const res = await a.get(`/api/reports/monthly?date=${date}`);
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('date');
  });
});

describe('daily report', () => {
  it('shows stats and the readings in slot order', async () => {
    const res = await a.get('/api/reports/daily?date=2026-10-15');
    expect(res.status).toBe(200);
    const r = res.body.report;
    expect(r.label).toBe('15 Oct 2026');
    expect(r.stats).toEqual({ count: 2, highest: 131, lowest: 110, average: 120.5 });
    expect(r.empty).toBe(false);
    expect(r.readings.map((x) => x.slot)).toEqual(['MORNING_FASTING', 'AFTER_DINNER']);
    expect(r.readings[0]).toMatchObject({ slotLabel: 'Morning (fasting)', value: 110 });
  });

  it("does not include another user's reading", async () => {
    const res = await a.get('/api/reports/daily?date=2026-10-15');
    expect(res.body.report.stats.highest).toBe(131); // would be 600 if b's reading leaked
  });
});

describe('month-to-date report', () => {
  it('covers the 1st of the month up to the selected date, inclusive', async () => {
    const res = await a.get('/api/reports/month-to-date?date=2026-10-15');
    const r = res.body.report;
    expect(r.range).toEqual({ from: '2026-10-01', to: '2026-10-15' });
    expect(r.label).toBe('1 Oct \u2013 15 Oct 2026');
    // 90 + 120 + 110 + 131 = 451 over 4 readings = 112.75, which rounds half up to 112.8
    expect(r.stats).toEqual({ count: 4, highest: 131, lowest: 90, average: 112.8 });
    expect(r.readings).toBeUndefined();
  });

  it('works on the 1st of the month', async () => {
    const r = (await a.get('/api/reports/month-to-date?date=2026-10-01')).body.report;
    expect(r.range).toEqual({ from: '2026-10-01', to: '2026-10-01' });
    expect(r.label).toBe('1 Oct 2026');
    expect(r.stats).toEqual({ count: 1, highest: 90, lowest: 90, average: 90 });
  });
});

describe('monthly report (the whole previous month)', () => {
  it('covers the previous month, including its first and last day only', async () => {
    const res = await a.get('/api/reports/monthly?date=2026-10-15');
    const r = res.body.report;
    expect(r.range).toEqual({ from: '2026-09-01', to: '2026-09-30' });
    expect(r.label).toBe('1 Sep \u2013 30 Sep 2026');
    // 100 + 150 + 200 = 450 over 3 readings; 31 Aug (500) and 1 Oct (90) are excluded
    expect(r.stats).toEqual({ count: 3, highest: 200, lowest: 100, average: 150 });
  });

  it('gives the same result for any day of the month', async () => {
    const first = (await a.get('/api/reports/monthly?date=2026-10-01')).body.report;
    const last = (await a.get('/api/reports/monthly?date=2026-10-16')).body.report;
    expect(first.stats).toEqual(last.stats);
  });

  it('handles the year change in January', async () => {
    const r = (await a.get('/api/reports/monthly?date=2026-01-15')).body.report;
    expect(r.range).toEqual({ from: '2025-12-01', to: '2025-12-31' });
    expect(r.label).toBe('1 Dec \u2013 31 Dec 2025');
    expect(r.stats).toEqual({ count: 2, highest: 88, lowest: 77, average: 82.5 });
  });
});

describe('empty state', () => {
  it.each(['daily', 'month-to-date', 'monthly'])('%s returns an empty report', async (type) => {
    const res = await empty.get(`/api/reports/${type}?date=2026-10-15`);
    expect(res.status).toBe(200);
    expect(res.body.report.empty).toBe(true);
    expect(res.body.report.stats).toEqual({ count: 0, highest: null, lowest: null, average: null });
  });

  it('the empty daily report has an empty readings list', async () => {
    const res = await empty.get('/api/reports/daily?date=2026-10-15');
    expect(res.body.report.readings).toEqual([]);
  });

  it('reports are live: a new reading appears at once and disappears when deleted', async () => {
    const created = await empty.post('/api/readings', { date: '2026-10-20', slot: 'MORNING_FASTING', value: 100 });
    expect(created.status).toBe(201);

    const withData = await empty.get('/api/reports/daily?date=2026-10-20');
    expect(withData.body.report.stats.count).toBe(1);

    await empty.del(`/api/readings/${created.body.reading.id}`);
    const after = await empty.get('/api/reports/daily?date=2026-10-20');
    expect(after.body.report.empty).toBe(true);
  });
});
