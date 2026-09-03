const { body, param } = require('express-validator');

const createScheduleValidator = [
  body('contentId').isMongoId().withMessage('Valid contentId is required'),
  body('platformId').isMongoId().withMessage('Valid platformId is required'),
  body('scheduledFor')
    .isISO8601()
    .withMessage('scheduledFor must be a valid date')
    .custom((value) => new Date(value) > new Date())
    .withMessage('scheduledFor must be in the future'),
];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid id')];

module.exports = { createScheduleValidator, idParamValidator };
