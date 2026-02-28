const express = require('express');
const router = express.Router();
const { 
    getCart, 
    addToCart, 
    updateCartItem, 
    removeFromCart 
} = require('../controllers/cart.controller');

// Import middleware xác thực dựa trên cấu trúc project của bạn
const { protect } = require('../middlewares/auth.middleware');

// Tất cả các route giỏ hàng đều yêu cầu đăng nhập
router.use(protect);

router.get('/', getCart);             // Lấy giỏ hàng
router.post('/add', addToCart);       // Thêm sản phẩm
router.put('/update', updateCartItem); // Cập nhật số lượng
router.delete('/remove/:itemId', removeFromCart); // Xóa sản phẩm

module.exports = router;