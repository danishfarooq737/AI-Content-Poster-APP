const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { ApiError, sendSuccess } = require('../utils/apiResponse');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/auth',
};

const logAudit = async (action, req, userId = null, metadata = {}) => {
  try {
    await AuditLog.create({
      user: userId,
      action,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      metadata,
    });
  } catch (_) {
    // Auditing must never break the primary request flow.
  }
};

// @desc Register a new user
// @route POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  // First registered user becomes admin automatically; everyone after is 'user'.
  const isFirstUser = (await User.countDocuments()) === 0;

  const user = await User.create({
    name,
    email,
    password,
    role: isFirstUser ? 'admin' : 'user',
  });

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  user.lastLoginAt = new Date();
  await user.save();

  await logAudit('AUTH_REGISTER', req, user._id, { email });

  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
  return sendSuccess(res, 201, 'Account created successfully', {
    user: user.toSafeObject(),
    accessToken,
  });
});

// @desc Login
// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
  const genericError = 'Invalid email or password.';

  if (!user) {
    await logAudit('AUTH_LOGIN_FAILED', req, null, { email, reason: 'no_user' });
    throw new ApiError(401, genericError);
  }

  if (user.isLocked) {
    await logAudit('AUTH_LOGIN_BLOCKED', req, user._id, { reason: 'locked' });
    throw new ApiError(423, 'Account temporarily locked due to repeated failed attempts. Try again later.');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'This account has been deactivated.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    user.loginAttempts += 1;
    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
    }
    await user.save();
    await logAudit('AUTH_LOGIN_FAILED', req, user._id, { reason: 'bad_password' });
    throw new ApiError(401, genericError);
  }

  user.loginAttempts = 0;
  user.lockUntil = null;
  user.lastLoginAt = new Date();

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await user.save();

  await logAudit('AUTH_LOGIN_SUCCESS', req, user._id);

  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
  return sendSuccess(res, 200, 'Logged in successfully', {
    user: user.toSafeObject(),
    accessToken,
  });
});

// @desc Refresh access token using httpOnly refresh cookie
// @route POST /api/auth/refresh
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, 'No refresh token provided.');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (_) {
    throw new ApiError(401, 'Invalid or expired refresh token.');
  }

  const user = await User.findById(decoded.id).select('+refreshTokenHash');
  if (!user || !user.refreshTokenHash) throw new ApiError(401, 'Invalid session.');

  const matches = await bcrypt.compare(token, user.refreshTokenHash);
  if (!matches) throw new ApiError(401, 'Invalid session.');

  const accessToken = generateAccessToken(user._id, user.role);
  return sendSuccess(res, 200, 'Token refreshed', { accessToken });
});

// @desc Logout - clears refresh token
// @route POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      await User.findByIdAndUpdate(decoded.id, { refreshTokenHash: null });
    } catch (_) {
      // ignore invalid token on logout
    }
  }
  res.clearCookie('refreshToken', { path: '/api/auth' });
  return sendSuccess(res, 200, 'Logged out successfully');
});

// @desc Get current authenticated user
// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, 'Current user', { user: req.user.toSafeObject() });
});

module.exports = { register, login, refresh, logout, getMe };
