const asyncHandler = require('express-async-handler');
const Content = require('../models/Content');
const Schedule = require('../models/Schedule');
const Platform = require('../models/Platform');
const { sendSuccess } = require('../utils/apiResponse');

// @desc Get the current user's dashboard summary
// @route GET /api/dashboard
const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [draftCount, scheduledCount, postedCount, failedCount, connectedPlatforms, upcoming] = await Promise.all([
    Content.countDocuments({ user: userId, status: { $in: ['draft', 'ready'] } }),
    Schedule.countDocuments({ user: userId, status: 'pending' }),
    Schedule.countDocuments({ user: userId, status: 'posted' }),
    Schedule.countDocuments({ user: userId, status: 'failed' }),
    Platform.countDocuments({ user: userId }),
    Schedule.find({ user: userId, status: 'pending' })
      .sort({ scheduledFor: 1 })
      .limit(5)
      .populate('content', 'title')
      .populate('platform', 'provider displayName'),
  ]);

  return sendSuccess(res, 200, 'Dashboard summary', {
    stats: { draftCount, scheduledCount, postedCount, failedCount, connectedPlatforms },
    upcoming,
  });
});

module.exports = { getDashboard };
