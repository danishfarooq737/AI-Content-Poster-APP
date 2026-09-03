const express = require('express');
const router = express.Router();
const { createSchedule, listSchedules, cancelSchedule } = require('../controllers/scheduleController');
const { createScheduleValidator, idParamValidator } = require('../validators/scheduleValidators');
const validateRequest = require('../middleware/validateRequest');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/', createScheduleValidator, validateRequest, createSchedule);
router.get('/', listSchedules);
router.delete('/:id', idParamValidator, validateRequest, cancelSchedule);

module.exports = router;
