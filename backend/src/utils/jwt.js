const jwt = require('jsonwebtoken');

const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
  });

const signRefreshToken = (payload) =>
  jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
  });

const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

// ms until a JWT expires (used when saving refresh token to DB)
const msUntilExpiry = (expiresIn) => {
  const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  const match = String(expiresIn).match(/^(\d+)([smhd])$/);
  if (!match) throw new Error('Invalid expiresIn format');
  return parseInt(match[1]) * units[match[2]];
};

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, msUntilExpiry };
