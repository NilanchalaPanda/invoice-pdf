const express = require('express');
const { 
  register, 
  login, 
  getProfile, 
  verifyToken,
  registerValidation,
  loginValidation
} = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimit');

const router = express.Router();

// Apply rate limiting to all auth routes
router.use(authLimiter);

// POST /api/auth/register
router.post('/register', registerValidation, register);

// POST /api/auth/login
router.post('/login', loginValidation, login);

// GET /api/auth/profile - Protected route
router.get('/profile', authenticate, getProfile);

// GET /api/auth/verify - Protected route
router.get('/verify', authenticate, verifyToken);

module.exports = router;