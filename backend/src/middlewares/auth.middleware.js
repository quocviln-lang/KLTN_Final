const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    // 1. Kiểm tra xem Frontend có gửi token lên qua Header không?
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Lấy token (cắt bỏ chữ "Bearer " ở đầu)
            token = req.headers.authorization.split(' ')[1];

            // 2. Giải mã token bằng JWT_SECRET (chìa khóa bí mật trong file .env)
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Tìm user trong Database dựa trên id vừa giải mã
            // Dùng .select('-password') để không lấy trường password ra cho an toàn
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Người dùng không tồn tại!' });
            }

            // Nếu mọi thứ OK, cho phép đi tiếp vào Controller
            next();
        } catch (error) {
            console.error('Lỗi xác thực Token:', error.message);
            return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn!' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập. Vui lòng cung cấp Token!' });
    }
};

// Middleware phân quyền dành riêng cho Admin
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: `Tài khoản '${req.user.role}' không có quyền truy cập chức năng này!` 
            });
        }
        next();
    };
};

module.exports = { protect, authorize };