require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const path = require('path');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const { errorHandler, notFound } = require('./middleware/error.middleware');

const app = express();

// ── Security & parsing ────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false })); // disabled so inline scripts work in dev
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,          // allow cookies cross-origin
}));
app.use(express.json());
app.use(cookieParser());

// ── Rate limiting ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Static files ─────────────────────────────────────────────────────────────
// Block direct access to backend source code
app.use((req, res, next) => {
  if (req.path.toLowerCase().startsWith('/backend')) return res.status(403).end();
  next();
});
// public/ first: login.html, dashboard.html (takes priority over calculus root)
app.use(express.static(path.join(__dirname, '../public')));
// calculus root: ch1-ch15, style.css, sidebar.js
app.use(express.static(path.join(__dirname, '../../')));

// ── Routes ────────────────────────────────────────────────────────────────────
// Authenticated API data is per-user and mutable — never let the browser cache it
// (otherwise a stale GET /api/users can hide freshly imported users until a hard reload).
app.use('/api', (_, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

app.get('/api/health', (_, res) => res.json({ success: true, message: 'OK' }));
app.use('/api/auth',  authLimiter, authRoutes);
app.use('/api/users', userRoutes);

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = app;
