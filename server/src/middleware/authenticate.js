const AppError = require('../lib/AppError');
const { verifyAccessToken } = require('../lib/tokens');

module.exports = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new AppError(401, 'Access token missing');
  }
  try {
    req.userId = Number(verifyAccessToken(token).sub);
    next();
  } catch {
    throw new AppError(401, 'Invalid or expired access token');
  }
};
