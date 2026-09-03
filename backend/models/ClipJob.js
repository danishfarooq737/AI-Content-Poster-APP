const mongoose = require('mongoose');

const clipJobSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['vizard'],
      default: 'vizard',
    },
    sourceVideoUrl: {
      type: String,
      required: [true, 'A source video URL is required'],
      trim: true,
    },
    externalProjectId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['queued', 'processing', 'ready', 'failed'],
      default: 'queued',
      index: true,
    },
    resultContentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content',
      },
    ],
    attempts: {
      type: Number,
      default: 0,
    },
    error: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

clipJobSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model('ClipJob', clipJobSchema);
