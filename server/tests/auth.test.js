const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');

const user = { name: 'Test User', email: 'auth-test@test.com', password: 'Password1' };

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: { endsWith: '@test.com' } } });
});
afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { endsWith: '@test.com' } } });
  await prisma.$disconnect();
});

describe('POST /api/auth/register', () => {
  it('registers a user and never returns the password', async () => {
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('stores a bcrypt hash, not plain text', async () => {
    const row = await prisma.user.findUnique({ where: { email: user.email } });
    expect(row.passwordHash).not.toBe(user.password);
    expect(row.passwordHash.startsWith('$2')).toBe(true);
  });

  it('rejects a duplicate email with 409', async () => {
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.status).toBe(409);
  });

  it.each([
    ['invalid email', { ...user, email: 'nope' }, 'email'],
    ['short password', { ...user, email: 'a@test.com', password: 'abc' }, 'password'],
    ['password without number', { ...user, email: 'b@test.com', password: 'abcdefgh' }, 'password'],
    ['empty name', { ...user, email: 'c@test.com', name: '' }, 'name'],
  ])('returns 400 for %s', async (_, payload, field) => {
    const res = await request(app).post('/api/auth/register').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.errors.map((e) => e.field)).toContain(field);
  });
});

describe('login / refresh / logout flow', () => {
  const agent = request.agent(app); // keeps cookies between calls
  let accessToken;

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'Wrong123' });
    expect(res.status).toBe(401);
  });

  it('rejects unknown email with the same message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@test.com', password: 'Password1' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('logs in, returns access token and sets httpOnly refresh cookie', async () => {
    const res = await agent
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.headers['set-cookie'][0]).toMatch(/refreshToken=.*HttpOnly/i);
    accessToken = res.body.accessToken;
  });

  it('stores only a hash of the refresh token in the DB', async () => {
    const rows = await prisma.refreshToken.findMany({
      where: { user: { email: user.email } },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].tokenHash).toHaveLength(64);
  });

  it('GET /me works with a valid token, fails without', async () => {
    const ok = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(ok.status).toBe(200);
    expect(ok.body.user.email).toBe(user.email);

    const bad = await request(app).get('/api/auth/me');
    expect(bad.status).toBe(401);
  });

  it('GET /me rejects a garbage token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer abc.def.ghi');
    expect(res.status).toBe(401);
  });

  it('refresh issues a new access token and rotates the cookie', async () => {
    const res = await agent.post('/api/auth/refresh');
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('refresh fails without a cookie', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });

  it('detects reuse of an old refresh token and revokes all sessions', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    const oldCookie = login.headers['set-cookie'][0].split(';')[0];

    const first = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', oldCookie);
    expect(first.status).toBe(200);

    const replay = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', oldCookie);
    expect(replay.status).toBe(401);

    const count = await prisma.refreshToken.count({
      where: { user: { email: user.email } },
    });
    expect(count).toBe(0);
  });

  it('logout removes the refresh token', async () => {
    const a = request.agent(app);
    await a.post('/api/auth/login').send({ email: user.email, password: user.password });
    expect((await a.post('/api/auth/logout')).status).toBe(200);
    expect((await a.post('/api/auth/refresh')).status).toBe(401);
  });
});
