const express = require('express');
const router = express.Router();
const { listPlatforms, listSupported, connect, callback, disconnect } = require('../controllers/platformController');
const { protect } = require('../middleware/authMiddleware');

router.get('/supported', listSupported);
router.get('/:provider/callback', callback); // Public: provider redirects the browser here

router.use(protect);
router.get('/', listPlatforms);
router.get('/:provider/connect', connect);
router.delete('/:id', disconnect);

module.exports = router;
