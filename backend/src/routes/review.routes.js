const express = require('express');
const router = express.Router();

const { 
    createReview, 
    getProductReviews, 
    toggleLike, 
    toggleDislike, 
    replyReview,
    updateReview,
    deleteReview,
    getAllReviews
} = require('../controllers/review.controller');

const { protect, authorize } = require('../middlewares/auth.middleware');

// ================= PUBLIC API =================
router.get('/product/:productId', getProductReviews);

// ================= ADMIN API =================
// Phải đặt route /admin/all lên trên /:id để tránh bị nhầm lẫn params
router.get('/admin/all', protect, authorize('admin'), getAllReviews);
router.put('/:id/reply', protect, authorize('admin'), replyReview);

// ================= USER API =================
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview); // Cập nhật đánh giá
router.delete('/:id', protect, deleteReview); // Xóa đánh giá

// Tương tác
router.put('/:id/like', protect, toggleLike);
router.put('/:id/dislike', protect, toggleDislike);

module.exports = router;