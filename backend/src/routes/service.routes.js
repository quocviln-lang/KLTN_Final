const express = require('express');
const router = express.Router();
const { 
    getServices, 
    createService, 
    updateService, 
    deleteService 
} = require('../controllers/service.controller');

const { protect, authorize } = require('../middlewares/auth.middleware');

// Public: Ai cũng có thể xem danh sách dịch vụ để chọn khi mua hàng
router.get('/', getServices);

// Admin: Chỉ Admin mới được quản lý các gói dịch vụ
router.post('/', protect, authorize('admin'), createService);
router.put('/:id', protect, authorize('admin'), updateService);
router.delete('/:id', protect, authorize('admin'), deleteService);

module.exports = router;