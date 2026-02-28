const express = require('express');
const router = express.Router();

const uploadCloud = require('../configs/cloudinary'); 
// Chỉ lấy protect, bỏ authorize vì chúng ta mở cho cả User
const { protect } = require('../middlewares/auth.middleware');

// API nhận ảnh và trả về đường link (Mở quyền cho mọi User đã đăng nhập)
router.post('/', protect, uploadCloud.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Không có file nào được tải lên' });
  }
  
  // Trả về đường link ảnh đã lưu thành công trên Cloudinary
  res.status(200).json({ success: true, url: req.file.path });
});

module.exports = router;