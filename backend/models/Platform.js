const mongoose = require('mongoose');

const platformSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['tiktok', 'youtube', 'instagram'],
      required: true,
    },
    providerAccountId: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      default: '',
    },
    profileImageUrl: {
      type: String,
      default: '',
    },
    // Tokens are stored encrypted at rest (see services/encryptionService.js)
    accessTokenEnc: {
      type: String,
      required: true,
      select: false,
    },
    refreshTokenEnc: {
      type: String,
      default: null,
      select: false,
    },
    tokenExpiresAt: {
      type: Date,
      default: null,
    },
    scopes: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['connected', 'expired', 'revoked', 'error'],
      default: 'connected',
    },
  },
  { timestamps: true }
);

platformSchema.index({ user: 1, provider: 1, providerAccountId: 1 }, { unique: true });

module.exports = mongoose.model('Platform', platformSchema);
