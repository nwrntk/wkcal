const { validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { hashPassword, comparePassword } = require('../utils/password');
const { signAccessToken, signRefreshToken, verifyRefreshToken, msUntilExpiry } = require('../utils/jwt');

const prisma = new PrismaClient();

const REFRESH_COOKIE = 'refreshToken';
const REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: msUntilExpiry(REFRESH_EXPIRES_IN),
};

// ── helpers ──────────────────────────────────────────────────────────────────

const issueTokens = async (user) => {
  const payload = { sub: user.id, role: user.role, username: user.username };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + msUntilExpiry(REFRESH_EXPIRES_IN)),
    },
  });

  return { accessToken, refreshToken };
};

const safeUser = ({ id, email, username, role, createdAt }) =>
  ({ id, email, username, role, createdAt });

// ── controllers ───────────────────────────────────────────────────────────────

const register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  try {
    const { email, username, password } = req.body;
    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), username, password: hashed },
    });

    const { accessToken, refreshToken } = await issueTokens(user);

    res
      .cookie(REFRESH_COOKIE, refreshToken, cookieOptions)
      .status(201)
      .json({ success: true, data: { user: safeUser(user), accessToken } });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const { accessToken, refreshToken } = await issueTokens(user);

    res
      .cookie(REFRESH_COOKIE, refreshToken, cookieOptions)
      .json({ success: true, data: { user: safeUser(user), accessToken } });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  const token = req.cookies[REFRESH_COOKIE];

  if (token) {
    try {
      await prisma.refreshToken.deleteMany({ where: { token } });
    } catch {
      // token already gone — fine
    }
  }

  res
    .clearCookie(REFRESH_COOKIE, cookieOptions)
    .json({ success: true, message: 'Logged out' });
};

const refresh = async (req, res, next) => {
  const token = req.cookies[REFRESH_COOKIE];

  if (!token) {
    return res.status(401).json({ success: false, message: 'No refresh token' });
  }

  try {
    const payload = verifyRefreshToken(token);

    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      res.clearCookie(REFRESH_COOKIE, cookieOptions);
      return res.status(401).json({ success: false, message: 'Refresh token invalid or expired' });
    }

    // Rotate: delete old, issue new pair
    await prisma.refreshToken.delete({ where: { token } });

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const { accessToken, refreshToken: newRefreshToken } = await issueTokens(user);

    res
      .cookie(REFRESH_COOKIE, newRefreshToken, cookieOptions)
      .json({ success: true, data: { accessToken } });
  } catch {
    res.clearCookie(REFRESH_COOKIE, cookieOptions);
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: { user: safeUser(user) } });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, logout, refresh, me };
