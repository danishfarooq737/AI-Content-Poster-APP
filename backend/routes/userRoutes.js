const express = require('express');
const router = express.Router();
const { listUsers, updateUser, deleteUser, platformStats } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('admin'));

router.get('/', listUsers);
router.get('/stats', platformStats);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
