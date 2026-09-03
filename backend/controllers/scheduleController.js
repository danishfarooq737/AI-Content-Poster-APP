const asyncHandler = require('express-async-handler');
const Schedule = require('../models/Schedule');
const Content = require('../models/Content');
const Platform = require('../models/Platform');
const { ApiError, sendSuccess } = require('../utils/apiResponse');

// @desc Schedule a piece of content to be posted to a connected platform
// @route POST /api/schedules
const createSchedule = asyncHandler(async (req, res) => {
  const { contentId, platformId, scheduledFor } = req.body;

  const [content, platform] = await Promise.all([
    Content.findOne({ _id: contentId, user: req.user._id }),
    Platform.findOne({ _id: platformId, user: req.user._id }),
  ]);

  if (!content) throw new ApiError(404, 'Content not found or not owned by you.');
  if (!platform) throw new ApiError(404, 'Connected platform not found or not owned by you.');

  const schedule = await Schedule.create({
    user: req.user._id,
    content: content._id,
    platform: platform._id,
    scheduledFor,
  });

  content.status = 'scheduled';
  await content.save();

  return sendSuccess(res, 201, 'Post scheduled successfully', { schedule });
});

// @desc List the caller's scheduled posts (calendar view)
// @route GET /api/schedules
const listSchedules = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' && req.query.all === 'true' ? {} : { user: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const schedules = await Schedule.find(filter)
    .populate('content', 'title caption status')
    .populate('platform', 'provider displayName')
    .sort({ scheduledFor: 1 });

  return sendSuccess(res, 200, 'Scheduled posts', { schedules });
});

// @desc Cancel a pending scheduled post (owner only)
// @route DELETE /api/schedules/:id
const cancelSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findOne({ _id: req.params.id, user: req.user._id });
  if (!schedule) throw new ApiError(404, 'Scheduled post not found.');
  if (schedule.status !== 'pending') {
    throw new ApiError(409, `Cannot cancel a post that is already ${schedule.status}.`);
  }
  schedule.status = 'canceled';
  await schedule.save();
  return sendSuccess(res, 200, 'Scheduled post canceled', { schedule });
});

module.exports = { createSchedule, listSchedules, cancelSchedule };
