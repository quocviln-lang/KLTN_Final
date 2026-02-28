const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// ================= CÁC ROUTE CỦA NGƯỜI DÙNG BÌNH THƯỜNG =================
router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.put('/password', protect, userController.changePassword);

// ================= CÁC ROUTE DÀNH RIÊNG CHO QUẢN TRỊ VIÊN =================
router.get('/admin/list', protect, authorize('admin'), userController.getUsersForAdmin);
router.post('/admin/create', protect, authorize('admin'), userController.createUserByAdmin);
router.put('/admin/:id', protect, authorize('admin'), userController.updateUserByAdmin);

module.exports = router;
