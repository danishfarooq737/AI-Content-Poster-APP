const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
      required: true,
    },
    platform: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Platform',
      required: true,
    },
    scheduledFor: {
      type: Date,
      required: [true, 'scheduledFor date is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'posted', 'failed', 'canceled'],
      default: 'pending',
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastAttemptAt: {
      type: Date,
      default: null,
    },
    postedAt: {
      type: Date,
      default: null,
    },
    externalPostId: {
      type: String,
      default: null,
    },
    externalPostUrl: {
      type: String,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

scheduleSchema.index({ status: 1, scheduledFor: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
