const { Router } = require('express');
const { body } = require('express-validator');
const { register, login, logout, refresh, me } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

const registerRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username: 3-30 chars, letters/numbers/underscore only'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

router.post('/register', registerRules, register);
router.post('/login',    loginRules,    login);
router.post('/logout',                 logout);
router.post('/refresh',                refresh);
router.get ('/me',       authenticate, me);

module.exports = router;
