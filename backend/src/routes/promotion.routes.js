const express = require('express');
const router = express.Router();
const { 
    getPromotions, 
    checkCoupon, 
    createPromotion, 
    updatePromotion, 
    deletePromotion,
    getActiveFlashSale
} = require('../controllers/promotion.controller');

const { protect, authorize } = require('../middlewares/auth.middleware');

// ================= PUBLIC ROUTES =================
router.get('/active-flashsale', getActiveFlashSale); // Lấy Flash Sale cho trang Home
router.post('/check-coupon', protect, checkCoupon);  // Kiểm tra mã lúc Checkout

// ================= ADMIN ROUTES =================
router.get('/', protect, authorize('admin'), getPromotions);
router.post('/', protect, authorize('admin'), createPromotion);
router.put('/:id', protect, authorize('admin'), updatePromotion);
router.delete('/:id', protect, authorize('admin'), deletePromotion);

module.exports = router;