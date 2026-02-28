const AuthService = require('../services/auth.service');

class AuthController {
    // 1. API Đăng ký
    static async register(req, res, next) {
        try {
            // Lấy dữ liệu từ Frontend truyền lên và gọi Service
            const newUser = await AuthService.register(req.body);
            
            // Trả kết quả thành công (Status 201: Created)
            res.status(201).json({
                success: true,
                message: 'Đăng ký tài khoản thành công!',
                data: newUser
            });
        } catch (error) {
            next(error); // Nếu có lỗi (vd: trùng email), ném thẳng cho Global Error Handler xử lý
        }
    }

    // 2. API Đăng nhập
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            
            // Gọi Service để check email, pass và tạo token
            const result = await AuthService.login(email, password);
            
            // Trả kết quả (Status 200: OK)
            res.status(200).json({
                success: true,
                message: 'Đăng nhập thành công!',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AuthController;