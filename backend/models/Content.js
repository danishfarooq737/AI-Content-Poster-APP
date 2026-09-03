const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    topic: {
      type: String,
      required: [true, 'A topic or prompt is required'],
      trim: true,
      maxlength: [280, 'Topic must be under 280 characters'],
    },
    title: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    script: {
      type: String,
      maxlength: 6000,
    },
    caption: {
      type: String,
      maxlength: 2200,
    },
    hashtags: {
      type: [String],
      default: [],
    },
    hookIdeas: {
      type: [String],
      default: [],
    },
    // Auto-generated, platform-specific posting content. Populated
    // automatically once a clip is ready (see services/aiService.js's
    // generatePlatformMetadata + services/clipPollerService.js) - the user
    // never has to type captions manually. Each platform gets exactly the
    // shape it actually needs:
    //   TikTok: a single caption (title + hashtags, no separate description)
    //   YouTube: title + description + a real tags[] array (both used)
    //   Instagram: a single caption (title + hashtags)
    platformMeta: {
      tiktok: {
        caption: { type: String, default: '' },
      },
      youtube: {
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        tags: { type: [String], default: [] },
      },
      instagram: {
        caption: { type: String, default: '' },
      },
    },
    // Video is a genuinely external dependency (a video-generation provider).
    // We track its lifecycle here without fabricating a rendered asset.
    videoAsset: {
      status: {
        type: String,
        enum: ['not_requested', 'queued', 'processing', 'ready', 'failed'],
        default: 'not_requested',
      },
      provider: { type: String, default: null },
      externalJobId: { type: String, default: null },
      url: { type: String, default: null },
      thumbnailUrl: { type: String, default: null },
      durationSeconds: { type: Number, default: null },
      error: { type: String, default: null },
    },
    aiModel: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'ready', 'scheduled', 'posted', 'archived'],
      default: 'draft',
      index: true,
    },
  },
  { timestamps: true }
);

contentSchema.index({ user: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Content', contentSchema);
