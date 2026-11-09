const bcrypt = require('bcrypt');
const prisma = require('../../lib/prisma');
const AppError = require('../../lib/AppError');
const t = require('../../lib/tokens');

const publicUser = ({ id, name, email, createdAt }) => ({ id, name, email, createdAt });

async function issueTokens(userId) {
  const accessToken = t.signAccessToken(userId);
  const refreshToken = t.signRefreshToken(userId);
  await prisma.refreshToken.create({
    data: {
      tokenHash: t.hashToken(refreshToken),
      userId,
      expiresAt: t.refreshExpiryDate(),
    },
  });
  return { accessToken, refreshToken };
}

async function register({ name, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError(409, 'An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, passwordHash } });
  return publicUser(user);
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) throw new AppError(401, 'Invalid email or password'); // same message on purpose

  const tokens = await issueTokens(user.id);
  return { user: publicUser(user), ...tokens };
}

async function refresh(token) {
  if (!token) throw new AppError(401, 'Refresh token missing');

  let payload;
  try {
    payload = t.verifyRefreshToken(token);
  } catch {
    throw new AppError(401, 'Invalid or expired refresh token');
  }
  const userId = Number(payload.sub);

  // Atomic: only one request can delete (use) a given token
  const { count } = await prisma.refreshToken.deleteMany({
    where: { tokenHash: t.hashToken(token), userId },
  });

  if (count === 0) {
    // Valid signature but not in DB = already used or revoked -> kill all sessions
    await prisma.refreshToken.deleteMany({ where: { userId } });
    throw new AppError(401, 'Refresh token reuse detected. Please log in again');
  }
  return issueTokens(userId);
}

async function logout(token) {
  if (!token) return;
  await prisma.refreshToken.deleteMany({ where: { tokenHash: t.hashToken(token) } });
}

async function getMe(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found');
  return publicUser(user);
}

module.exports = { register, login, refresh, logout, getMe };
