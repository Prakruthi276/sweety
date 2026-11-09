const env = require('../../config/env');
const service = require('./auth.service');

const COOKIE = 'refreshToken';
const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth',
  maxAge: env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
};

exports.register = async (req, res) => {
  const user = await service.register(req.body);
  res.status(201).json({ user });
};

exports.login = async (req, res) => {
  const { user, accessToken, refreshToken } = await service.login(req.body);
  res.cookie(COOKIE, refreshToken, cookieOptions);
  res.json({ user, accessToken });
};

exports.refresh = async (req, res) => {
  const { accessToken, refreshToken } = await service.refresh(req.cookies[COOKIE]);
  res.cookie(COOKIE, refreshToken, cookieOptions);
  res.json({ accessToken });
};

exports.logout = async (req, res) => {
  await service.logout(req.cookies[COOKIE]);
  res.clearCookie(COOKIE, { ...cookieOptions, maxAge: undefined });
  res.json({ message: 'Logged out' });
};

exports.me = async (req, res) => {
  res.json({ user: await service.getMe(req.userId) });
};
