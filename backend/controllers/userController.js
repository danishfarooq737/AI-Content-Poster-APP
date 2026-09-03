const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Content = require('../models/Content');
const Schedule = require('../models/Schedule');
const { ApiError, sendSuccess } = require('../utils/apiResponse');

// @desc List all users (admin only)
// @route GET /api/users
const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  return sendSuccess(res, 200, 'Users', { users: users.map((u) => u.toSafeObject()) });
});

// @desc Update a user's role or active status (admin only)
// @route PATCH /api/users/:id
const updateUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot modify your own role or status.');
  }

  const updates = {};
  if (req.body.role) {
    if (!['admin', 'user'].includes(req.body.role)) throw new ApiError(400, 'Invalid role.');
    updates.role = req.body.role;
  }
  if (typeof req.body.isActive === 'boolean') updates.isActive = req.body.isActive;

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!user) throw new ApiError(404, 'User not found.');

  return sendSuccess(res, 200, 'User updated', { user: user.toSafeObject() });
});

// @desc Delete a user (admin only)
// @route DELETE /api/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot delete your own account.');
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  return sendSuccess(res, 200, 'User deleted');
});

// @desc Platform-wide stats (admin only)
// @route GET /api/users/stats
const platformStats = asyncHandler(async (req, res) => {
  const [userCount, contentCount, scheduledCount, postedCount] = await Promise.all([
    User.countDocuments(),
    Content.countDocuments(),
    Schedule.countDocuments({ status: 'pending' }),
    Schedule.countDocuments({ status: 'posted' }),
  ]);
  return sendSuccess(res, 200, 'Platform stats', { userCount, contentCount, scheduledCount, postedCount });
});

module.exports = { listUsers, updateUser, deleteUser, platformStats };
