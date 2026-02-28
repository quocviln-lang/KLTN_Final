const express = require('express');
const router = express.Router();
const { 
    getPromotions, 
    checkCoupon, 
    createPromotion, 
    updatePromotion, 
    deletePromotion,
    getActiveFlashSale,
    playMinigame,
    addTestSpins
} = require('../controllers/promotion.controller');

const { protect, authorize } = require('../middlewares/auth.middleware');

// ================= PUBLIC & USER ROUTES =================
router.get('/active-flashsale', getActiveFlashSale); // Lấy Flash Sale cho trang Home
router.get('/active', getPromotions); // Lấy danh sách khuyến mãi đang diễn ra cho client
router.post('/check-coupon', protect, checkCoupon);  // Kiểm tra mã lúc Checkout
router.post('/spin', protect, playMinigame);         // Mini-game vòng quay may mắn
router.post('/add-spins', protect, addTestSpins);    // Nút thủ thuật thêm lượt cho test

// ================= ADMIN ROUTES =================
router.get('/', protect, authorize('admin'), getPromotions);
router.post('/', protect, authorize('admin'), createPromotion);
router.put('/:id', protect, authorize('admin'), updatePromotion);
router.delete('/:id', protect, authorize('admin'), deletePromotion);

module.exports = router;