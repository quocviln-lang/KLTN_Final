const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// ==========================================
// CÁC TUYẾN ĐƯỜNG (ROUTES) DÀNH CHO ADMIN
// ==========================================
// THỐNG KÊ DASHBOARD ĐƠN HÀNG
router.get('/admin/stats', protect, authorize('admin'), orderController.getAdminOrderStats);

// LẤY DANH SÁCH & TIẾT KIẾM ĐƠN HÀNG (CÓ PHÂN TRANG, LỌC)
router.get('/admin', protect, authorize('admin'), orderController.getAdminOrders);

// CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
router.put('/admin/:id/status', protect, authorize('admin'), orderController.updateOrderStatus);

// ==========================================
// CÁC TUYẾN ĐƯỜNG DÀNH CHO KHÁCH HÀNG
// ==========================================
// Lấy danh sách Đơn hàng của User hiện tại (Lịch sử đặt hàng)
router.get('/me', protect, orderController.getMyOrders);

// Tạo Đơn Hàng Mới
// Yêu cầu token hợp lệ (protect)
router.post('/', protect, orderController.createOrder);

module.exports = router;
