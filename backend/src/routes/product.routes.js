const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/product.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Các API công khai
router.get('/', ProductController.getAllProducts);

// Các API yêu cầu quyền Admin
router.post('/', protect, authorize('admin'), ProductController.createProduct);
router.put('/:id', protect, authorize('admin'), ProductController.updateProduct);
router.delete('/:id', protect, authorize('admin'), ProductController.deleteProduct);

module.exports = router;