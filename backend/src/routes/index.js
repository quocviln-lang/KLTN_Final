const express = require('express');
const router = express.Router();

// Import các module Routes
const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const uploadRouter = require('./upload.routes');
const reviewRoutes = require('./review.routes');
const cartRoutes = require('./cart.routes');
const serviceRoutes = require('./service.routes');
const promotionRoutes = require('./promotion.routes'); // <-- MỚI THÊM

// Các module API
router.use('/v1/auth', authRoutes);
router.use('/v1/products', productRoutes); 
router.use('/v1/upload', uploadRouter);
router.use('/v1/reviews', reviewRoutes);
router.use('/v1/cart', cartRoutes);
router.use('/v1/services', serviceRoutes);
router.use('/v1/promotions', promotionRoutes); // <-- MỚI THÊM

// Các API lẻ dành cho Admin
const AdminController = require('../controllers/admin.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.get('/v1/admin/stats', protect, authorize('admin'), AdminController.getStats);

module.exports = router;