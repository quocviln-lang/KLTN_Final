const express = require('express');
const router = express.Router();
const {
    createFeedback,
    getFeedbacks,
    deleteFeedback
} = require('../controllers/feedback.controller');

const { protect, authorize } = require('../middlewares/auth.middleware');

// Public route cho khách gửi liên hệ
router.post('/', createFeedback);

// Admin route quản lý hộp thư
router.get('/', protect, authorize('admin'), getFeedbacks);
router.delete('/:id', protect, authorize('admin'), deleteFeedback);

module.exports = router;
