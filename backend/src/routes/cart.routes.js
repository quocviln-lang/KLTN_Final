const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cart.controller');
const { protect } = require('../middlewares/auth.middleware');

// Bảo vệ toàn bộ route giỏ hàng, yêu cầu đăng nhập
router.use(protect);

// Định nghĩa các route rõ ràng
router.get('/', CartController.getCart);
router.post('/add', CartController.addToCart);
router.put('/update', CartController.updateQuantity);
router.delete('/:itemId', CartController.removeItem);

module.exports = router;