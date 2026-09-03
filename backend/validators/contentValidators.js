const { body, param } = require('express-validator');

const clipJobValidator = [
  body('videoUrl')
    .trim()
    .isURL({ require_protocol: true })
    .withMessage('A valid video URL (including https://) is required'),
];

const updateContentValidator = [
  param('id').isMongoId().withMessage('Invalid content id'),
  body('title').optional().trim().isLength({ max: 150 }),
  body('hashtags').optional().isArray({ max: 15 }),
  body('platformMeta.tiktok.caption').optional().trim().isLength({ max: 2200 }),
  body('platformMeta.youtube.title').optional().trim().isLength({ max: 100 }),
  body('platformMeta.youtube.description').optional().trim().isLength({ max: 5000 }),
  body('platformMeta.youtube.tags').optional().isArray({ max: 15 }),
  body('platformMeta.instagram.caption').optional().trim().isLength({ max: 2200 }),
];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid id')];

module.exports = { clipJobValidator, updateContentValidator, idParamValidator };
