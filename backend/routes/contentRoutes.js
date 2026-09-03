const express = require('express');
const router = express.Router();
const {
  listContent,
  getContent,
  updateContent,
  deleteContent,
  startClipJob,
  listClipJobs,
  clipSupported,
} = require('../controllers/contentController');
const { clipJobValidator, updateContentValidator, idParamValidator } = require('../validators/contentValidators');
const validateRequest = require('../middleware/validateRequest');
const { protect } = require('../middleware/authMiddleware');
const { aiLimiter } = require('../middleware/rateLimiters');

router.use(protect);

router.get('/clip/supported', clipSupported);
router.post('/clip', aiLimiter, clipJobValidator, validateRequest, startClipJob);
router.get('/clip-jobs', listClipJobs);
router.get('/', listContent);
router.get('/:id', idParamValidator, validateRequest, getContent);
router.put('/:id', updateContentValidator, validateRequest, updateContent);
router.delete('/:id', idParamValidator, validateRequest, deleteContent);

module.exports = router;
