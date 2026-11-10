const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');
const { todayString } = require('../src/lib/dates');

const today = todayString();
const daysAgo = (n) => {
  const d = new Date(`${today}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};
const tomorrow = daysAgo(-1);

async function signup(email) {
  const password = 'Password1';
  await request(app).post('/api/auth/register').send({ name: 'Reader', email, password });
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.accessToken;
}

const as = (token) => ({
  get: (url) => request(app).get(url).set('Authorization', `Bearer ${token}`),
  post: (url, body) => request(app).post(url).set('Authorization', `Bearer ${token}`).send(body),
  put: (url, body) => request(app).put(url).set('Authorization', `Bearer ${token}`).send(body),
  del: (url) => request(app).delete(url).set('Authorization', `Bearer ${token}`),
});

const errorFor = (res, field) => res.body.errors.find((e) => e.field === field)?.message;
const cleanup = () => prisma.user.deleteMany({ where: { email: { endsWith: '@test.com' } } });

let a; // user A
let b; // user B

beforeAll(async () => {
  await cleanup();
  a = as(await signup('reader-a@test.com'));
  b = as(await signup('reader-b@test.com'));
});
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe('authentication required', () => {
  it.each([
    ['get', '/api/readings'],
    ['post', '/api/readings'],
    ['get', '/api/readings/1'],
    ['put', '/api/readings/1'],
    ['delete', '/api/readings/1'],
  ])('%s %s returns 401 without a token', async (method, url) => {
    const res = await request(app)[method](url);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/readings: creating', () => {
  it('creates a reading', async () => {
    const res = await a.post('/api/readings', { date: daysAgo(1), slot: 'MORNING_FASTING', value: 95 });
    expect(res.status).toBe(201);
    expect(res.body.reading).toMatchObject({
      date: daysAgo(1), slot: 'MORNING_FASTING', slotLabel: 'Morning (fasting)', value: 95,
    });
  });

  it('accepts the boundary values 40 and 600', async () => {
    const low = await a.post('/api/readings', { date: daysAgo(2), slot: 'AFTER_BREAKFAST', value: 40 });
    const high = await a.post('/api/readings', { date: daysAgo(2), slot: 'AFTER_LUNCH', value: 600 });
    expect(low.status).toBe(201);
    expect(high.status).toBe(201);
  });

  it('accepts today', async () => {
    const res = await a.post('/api/readings', { date: today, slot: 'MORNING_FASTING', value: 100 });
    expect(res.status).toBe(201);
  });
});

describe('POST /api/readings: validation rules', () => {
  const base = { date: daysAgo(3), slot: 'MORNING_FASTING' };

  it.each([
    ['missing', undefined],
    ['empty string', ''],
    ['null', null],
  ])('requires a value (%s)', async (_, value) => {
    const res = await a.post('/api/readings', { ...base, value });
    expect(res.status).toBe(400);
    expect(errorFor(res, 'value')).toBe('Please enter a glucose value.');
  });

  it.each([[39], [601], [-5], [100.5], ['abc']])('rejects value %p', async (value) => {
    const res = await a.post('/api/readings', { ...base, value });
    expect(res.status).toBe(400);
    expect(errorFor(res, 'value')).toBe('Value must be between 40 and 600 mg/dl.');
  });

  it('rejects a future date', async () => {
    const res = await a.post('/api/readings', { date: tomorrow, slot: 'MORNING_FASTING', value: 100 });
    expect(res.status).toBe(400);
    expect(errorFor(res, 'date')).toBe('Date cannot be in the future.');
  });

  it.each([['2026-02-31'], ['hello'], ['']])('rejects invalid date %p', async (date) => {
    const res = await a.post('/api/readings', { date, slot: 'MORNING_FASTING', value: 100 });
    expect(res.status).toBe(400);
    expect(errorFor(res, 'date')).toBeDefined();
  });

  it('rejects an unknown slot', async () => {
    const res = await a.post('/api/readings', { ...base, slot: 'BRUNCH', value: 100 });
    expect(res.status).toBe(400);
    expect(errorFor(res, 'slot')).toBe('Please choose a time slot.');
  });

  it('reports every missing field for an empty body', async () => {
    const res = await a.post('/api/readings', {});
    expect(res.status).toBe(400);
    expect(res.body.errors.map((e) => e.field)).toEqual(expect.arrayContaining(['date', 'slot', 'value']));
  });
});

describe('POST /api/readings: business rules', () => {
  it('rejects a second reading for the same slot and date', async () => {
    const day = daysAgo(4);
    expect((await a.post('/api/readings', { date: day, slot: 'AFTER_LUNCH', value: 120 })).status).toBe(201);

    const dup = await a.post('/api/readings', { date: day, slot: 'AFTER_LUNCH', value: 130 });
    expect(dup.status).toBe(409);
    expect(dup.body.message).toBe('You already have an After lunch reading for this date.');
  });

  it('allows the same slot on a different date', async () => {
    const res = await a.post('/api/readings', { date: daysAgo(5), slot: 'AFTER_LUNCH', value: 120 });
    expect(res.status).toBe(201);
  });

  it('allows only 4 readings per day', async () => {
    const day = daysAgo(6);
    for (const slot of ['MORNING_FASTING', 'AFTER_BREAKFAST', 'AFTER_LUNCH', 'AFTER_DINNER']) {
      expect((await a.post('/api/readings', { date: day, slot, value: 110 })).status).toBe(201);
    }
    const fifth = await a.post('/api/readings', { date: day, slot: 'MORNING_FASTING', value: 110 });
    expect(fifth.status).toBe(409);
    expect(fifth.body.message).toBe('You can add only 4 readings per day.');
  });

  it('lets another user use the same slot on the same date', async () => {
    const res = await b.post('/api/readings', { date: daysAgo(1), slot: 'MORNING_FASTING', value: 100 });
    expect(res.status).toBe(201);
  });
});

describe('GET /api/readings: listing', () => {
  it("returns only the logged-in user's readings", async () => {
    const [countA, countB] = await Promise.all([
      prisma.reading.count({ where: { user: { email: 'reader-a@test.com' } } }),
      prisma.reading.count({ where: { user: { email: 'reader-b@test.com' } } }),
    ]);
    const resA = await a.get('/api/readings?limit=100');
    const resB = await b.get('/api/readings?limit=100');
    expect(resA.body.pagination.total).toBe(countA);
    expect(resB.body.pagination.total).toBe(countB);
  });

  it('filters by date', async () => {
    const res = await a.get(`/api/readings?date=${daysAgo(2)}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.every((r) => r.date === daysAgo(2))).toBe(true);
  });

  it('paginates', async () => {
    const p1 = await a.get('/api/readings?limit=2&page=1');
    const p2 = await a.get('/api/readings?limit=2&page=2');
    expect(p1.body.data).toHaveLength(2);
    expect(p2.body.data).toHaveLength(2);
    expect(p1.body.pagination.totalPages).toBe(Math.ceil(p1.body.pagination.total / 2));
    const ids1 = p1.body.data.map((r) => r.id);
    expect(p2.body.data.some((r) => ids1.includes(r.id))).toBe(false);
  });

  it.each([['page=0'], ['limit=1000'], ['date=nope']])('rejects invalid query %s', async (qs) => {
    const res = await a.get(`/api/readings?${qs}`);
    expect(res.status).toBe(400);
  });
});

describe('get, update and delete', () => {
  let id;
  let id2;

  beforeAll(async () => {
    id = (await a.post('/api/readings', { date: daysAgo(7), slot: 'AFTER_DINNER', value: 150 })).body.reading.id;
    id2 = (await a.post('/api/readings', { date: daysAgo(7), slot: 'AFTER_LUNCH', value: 140 })).body.reading.id;
  });

  it("gets own reading, but not another user's", async () => {
    expect((await a.get(`/api/readings/${id}`)).status).toBe(200);
    expect((await b.get(`/api/readings/${id}`)).status).toBe(404);
  });

  it('rejects a bad id and an unknown id', async () => {
    expect((await a.get('/api/readings/abc')).status).toBe(400);
    expect((await a.get('/api/readings/999999')).status).toBe(404);
  });

  it('updates the value', async () => {
    const res = await a.put(`/api/readings/${id}`, { date: daysAgo(7), slot: 'AFTER_DINNER', value: 160 });
    expect(res.status).toBe(200);
    expect(res.body.reading.value).toBe(160);
  });

  it('rejects an update that clashes with another slot', async () => {
    const res = await a.put(`/api/readings/${id2}`, { date: daysAgo(7), slot: 'AFTER_DINNER', value: 140 });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('You already have an After dinner reading for this date.');
  });

  it('rejects an update that moves a reading to a full day', async () => {
    const res = await a.put(`/api/readings/${id2}`, { date: daysAgo(6), slot: 'AFTER_LUNCH', value: 140 });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('You can add only 4 readings per day.');
  });

  it('applies the validation rules to updates', async () => {
    const badValue = await a.put(`/api/readings/${id}`, { date: daysAgo(7), slot: 'AFTER_DINNER', value: 5 });
    expect(badValue.status).toBe(400);
    const future = await a.put(`/api/readings/${id}`, { date: tomorrow, slot: 'AFTER_DINNER', value: 100 });
    expect(future.status).toBe(400);
  });

  it("does not let another user edit or delete someone else's reading", async () => {
    const put = await b.put(`/api/readings/${id}`, { date: daysAgo(7), slot: 'AFTER_DINNER', value: 100 });
    expect(put.status).toBe(404);
    expect((await b.del(`/api/readings/${id}`)).status).toBe(404);
    expect((await a.get(`/api/readings/${id}`)).status).toBe(200); // still there
  });

  it('deletes own reading', async () => {
    expect((await a.del(`/api/readings/${id}`)).status).toBe(204);
    expect((await a.get(`/api/readings/${id}`)).status).toBe(404);
  });
});
