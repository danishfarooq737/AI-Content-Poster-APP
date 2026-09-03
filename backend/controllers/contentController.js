const asyncHandler = require('express-async-handler');
const Content = require('../models/Content');
const ClipJob = require('../models/ClipJob');
const vizardService = require('../services/vizardService');
const { ApiError, sendSuccess } = require('../utils/apiResponse');

// @desc List current user's content (admins may pass ?all=true)
// @route GET /api/content
const listContent = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = req.user.role === 'admin' && req.query.all === 'true' ? {} : { user: req.user._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Content.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Content.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, 'Content list', items, {
    page: Number(page),
    limit: Number(limit),
    total,
    pages: Math.ceil(total / Number(limit)) || 1,
  });
});

// @desc Get one content item (owner or admin only - prevents IDOR)
// @route GET /api/content/:id
const getContent = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id };
  if (req.user.role !== 'admin') filter.user = req.user._id;

  const content = await Content.findOne(filter);
  if (!content) throw new ApiError(404, 'Content not found.');
  return sendSuccess(res, 200, 'Content', { content });
});

// @desc Update editable fields of a content draft (owner only).
// Supports overriding the auto-generated per-platform metadata, in case the
// user wants to tweak what AI produced - but nothing here is required input.
// @route PUT /api/content/:id
const updateContent = asyncHandler(async (req, res) => {
  const content = await Content.findOne({ _id: req.params.id, user: req.user._id });
  if (!content) throw new ApiError(404, 'Content not found.');

  if (req.body.title !== undefined) content.title = req.body.title;
  if (req.body.hashtags !== undefined) content.hashtags = req.body.hashtags;

  if (req.body.platformMeta?.tiktok?.caption !== undefined) {
    content.platformMeta.tiktok.caption = req.body.platformMeta.tiktok.caption;
  }
  if (req.body.platformMeta?.youtube) {
    const yt = req.body.platformMeta.youtube;
    if (yt.title !== undefined) content.platformMeta.youtube.title = yt.title;
    if (yt.description !== undefined) content.platformMeta.youtube.description = yt.description;
    if (yt.tags !== undefined) content.platformMeta.youtube.tags = yt.tags;
  }
  if (req.body.platformMeta?.instagram?.caption !== undefined) {
    content.platformMeta.instagram.caption = req.body.platformMeta.instagram.caption;
  }

  await content.save();
  return sendSuccess(res, 200, 'Content updated', { content });
});

// @desc Delete a content draft (owner only)
// @route DELETE /api/content/:id
const deleteContent = asyncHandler(async (req, res) => {
  const content = await Content.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!content) throw new ApiError(404, 'Content not found.');
  return sendSuccess(res, 200, 'Content deleted');
});

// @desc Start clipping a long-form video (by URL) into short viral clips via Vizard.ai.
// Captions/titles/tags for every platform are generated automatically once
// the clip is ready - no further input needed from the user.
// @route POST /api/content/clip
const startClipJob = asyncHandler(async (req, res) => {
  const { videoUrl } = req.body;

  const { projectId } = await vizardService.createClipProject({ videoUrl });

  const job = await ClipJob.create({
    user: req.user._id,
    sourceVideoUrl: videoUrl,
    externalProjectId: projectId,
    status: 'processing',
  });

  return sendSuccess(res, 201, 'Clip job started - this usually takes a few minutes', { job });
});

// @desc List the caller's clip jobs (frontend polls this to show progress)
// @route GET /api/content/clip-jobs
const listClipJobs = asyncHandler(async (req, res) => {
  const jobs = await ClipJob.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('resultContentIds', 'title status videoAsset platformMeta');

  return sendSuccess(res, 200, 'Clip jobs', { jobs });
});

// @desc Whether Vizard is configured on this server
// @route GET /api/content/clip/supported
const clipSupported = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, 'Vizard status', { configured: vizardService.isConfigured() });
});

module.exports = {
  listContent,
  getContent,
  updateContent,
  deleteContent,
  startClipJob,
  listClipJobs,
  clipSupported,
};
