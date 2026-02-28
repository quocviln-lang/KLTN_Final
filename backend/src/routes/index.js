const express = require('express');
const router = express.Router();

// Import các module Routes
const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const uploadRouter = require('./upload.routes');
const reviewRoutes = require('./review.routes');
const cartRoutes = require('./cart.routes');
const serviceRoutes = require('./service.routes');
const promotionRoutes = require('./promotion.routes'); 
const userRoutes = require('./user.routes');
const orderRoutes = require('./order.routes'); 
const articleRoutes = require('./article.routes');
const feedbackRoutes = require('./feedback.routes');

// Các module API
router.use('/v1/auth', authRoutes);
router.use('/v1/products', productRoutes); 
router.use('/v1/upload', uploadRouter);
router.use('/v1/reviews', reviewRoutes);
router.use('/v1/cart', cartRoutes);
router.use('/v1/services', serviceRoutes);
router.use('/v1/promotions', promotionRoutes); 
router.use('/v1/users', userRoutes);
router.use('/v1/orders', orderRoutes); 
router.use('/v1/articles', articleRoutes);
router.use('/v1/feedbacks', feedbackRoutes);

// Các API lẻ dành cho Admin
const AdminController = require('../controllers/admin.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.get('/v1/admin/stats', protect, authorize('admin'), AdminController.getStats);

module.exports = router;