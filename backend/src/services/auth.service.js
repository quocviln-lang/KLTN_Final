const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthService {
    
    // 1. DỊCH VỤ ĐĂNG KÝ (REGISTER)
    static async register(data) {
        const { name, email, password, phone } = data;

        // Bước 1: Kiểm tra xem email đã tồn tại chưa
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const error = new Error('Email này đã được sử dụng!');
            error.status = 400; // 400 Bad Request
            throw error; // Ném lỗi này ra để Global Error Handler (ở app.js) bắt lấy
        }

        // Bước 2: Băm (Hash) mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Bước 3: Lưu vào Database
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            phone
        });

        // Không trả về mật khẩu cho Frontend
        newUser.password = undefined;
        return newUser;
    }

    // 2. DỊCH VỤ ĐĂNG NHẬP (LOGIN)
    static async login(email, password) {
        // Bước 1: Tìm User theo email
        const user = await User.findOne({ email });
        if (!user) {
            const error = new Error('Email hoặc mật khẩu không chính xác!');
            error.status = 401; // 401 Unauthorized
            throw error;
        }

        // Bước 2: Kiểm tra trạng thái tài khoản (chúng ta đã thêm isActive lúc thiết kế DB)
        if (!user.isActive) {
            const error = new Error('Tài khoản của bạn đã bị khóa!');
            error.status = 403; // 403 Forbidden
            throw error;
        }

        // Bước 3: So sánh mật khẩu người dùng nhập với mật khẩu đã Hash trong DB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            const error = new Error('Email hoặc mật khẩu không chính xác!');
            error.status = 401;
            throw error;
        }

        // Bước 4: Tạo Token (JWT)
        const payload = {
            id: user._id,
            role: user.role
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        // Xóa password trước khi trả về data cho an toàn
        user.password = undefined;

        return { user, token };
    }
}

module.exports = AuthService;