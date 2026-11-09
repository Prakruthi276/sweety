const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const signAccessToken = (userId) =>
  jwt.sign({}, env.ACCESS_TOKEN_SECRET, {
    subject: String(userId),
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
  });

// jwtid makes every refresh token unique, even if issued in the same second
const signRefreshToken = (userId) =>
  jwt.sign({}, env.REFRESH_TOKEN_SECRET, {
    subject: String(userId),
    expiresIn: `${env.REFRESH_TOKEN_EXPIRES_DAYS}d`,
    jwtid: crypto.randomUUID(),
  });

const verifyAccessToken = (t) => jwt.verify(t, env.ACCESS_TOKEN_SECRET);
const verifyRefreshToken = (t) => jwt.verify(t, env.REFRESH_TOKEN_SECRET);

const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

const refreshExpiryDate = () =>
  new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  refreshExpiryDate,
};
