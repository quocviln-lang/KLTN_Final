const User = require('../models/User');

class UserController {
    // Lấy thông tin cá nhân hiện tại
    async getProfile(req, res) {
        try {
            // req.user được lấy từ auth.middleware (người dùng đang đăng nhập)
            const user = await User.findById(req.user._id).select('-password');
            if (!user) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
            }
            res.status(200).json({ success: true, data: user });
        } catch (error) {
            console.error('Lỗi khi lấy profile:', error);
            res.status(500).json({ success: false, message: 'Lỗi server khi lấy thông tin cá nhân' });
        }
    }

    // Cập nhật thông tin cá nhân
    async updateProfile(req, res) {
        try {
            const { name, phone, email, avatar, shippingAddress } = req.body;
            
            // Tìm user
            let user = await User.findById(req.user._id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
            }

            // Gán dữ liệu cơ bản
            if (name) user.name = name;
            if (phone) user.phone = phone;
            if (email) user.email = email;
            if (avatar) user.avatar = avatar;

            // Xử lý địa chỉ (chuyển đổi từ chuỗi string Textarea vào mảng addresses[0].detail)
            if (shippingAddress !== undefined) {
                if (user.addresses.length === 0) {
                    // Nếu chưa có địa chỉ nào, tạo mới cái đầu tiên
                    user.addresses.push({
                        detail: shippingAddress,
                        isDefault: true
                    });
                } else {
                    // Cập nhật cái đầu tiên
                    user.addresses[0].detail = shippingAddress;
                }
            }

            // Lưu lại DB
            await user.save();
            
            // Ẩn nội dung nhạy cảm trước khi trả về
            const updatedUser = user.toObject();
            delete updatedUser.password;

            res.status(200).json({ 
                success: true, 
                message: 'Cập nhật thông tin thành công',
                data: updatedUser 
            });
        } catch (error) {
            console.error('Lỗi cập nhật profile:', error);
            res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật' });
        }
    }

    // Cập nhật mật khẩu 
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            
            // Validate đầu vào
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ success: false, message: 'Vui lòng cung cấp cả mật khẩu hiện tại và mật khẩu mới' });
            }

            // Tìm user (Cần select '+password' vì mặc định schema ẩn field password)
            const user = await User.findById(req.user._id).select('+password');
            if (!user) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
            }

            // Gọi thư viện bcrypt để so sánh mật khẩu cũ
            const bcrypt = require('bcryptjs'); // Import ở đây hoặc đầu file
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác' });
            }

            // Nếu đúng -> Mã hóa mật khẩu mới
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);

            // Lưu vào CSDL
            await user.save();

            res.status(200).json({ 
                success: true, 
                message: 'Thay đổi mật khẩu thành công. Vui lòng đăng nhập lại ở lần truy cập sau.' 
            });

        } catch (error) {
            console.error('Lỗi đổi mật khẩu:', error);
            res.status(500).json({ success: false, message: 'Lỗi server khi đổi mật khẩu' });
        }
    }

    // ================== CÁC API DÀNH RIÊNG CHO ADMIN ==================

    // 1. Lấy danh sách Users (Phân trang, Tìm kiếm, Lọc)
    async getUsersForAdmin(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const { search, role, status } = req.query;

            // Xây dựng bộ lọc query
            let query = {};
            
            // Tìm kiếm theo tên hoặc email
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ];
            }

            // Lọc theo Role
            if (role && role !== 'All') {
                query.role = role.toLowerCase();
            }

            // Lọc theo Status 
            if (status && status !== 'All') {
                if (status === 'Active') query.isActive = true;
                if (status === 'Pending' || status === 'Suspended') query.isActive = false; // Tạm quy ước false là suspended/pending
            }

            const total = await User.countDocuments(query);
            const users = await User.find(query)
                .select('-password') // Giấu password
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            res.status(200).json({
                success: true,
                data: {
                    docs: users,
                    totalDocs: total,
                    page,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Lỗi lấy danh sách User (Admin):', error);
            res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    }

    // 2. Tạo User Mới (Admin)
    async createUserByAdmin(req, res) {
        try {
            const { name, email, password, role, phone, isActive } = req.body;

            // Kiểm tra email tồn tại
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Email đã được sử dụng!' });
            }

            // Mã hóa mật khẩu
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password || '123456', salt); // Mặc định pass 123456 nếu không nhập

            const newUser = new User({
                name,
                email,
                password: hashedPassword,
                role: role || 'user',
                phone: phone || '',
                isActive: isActive !== undefined ? isActive : true
            });

            await newUser.save();
            
            const userResponse = newUser.toObject();
            delete userResponse.password;

            res.status(201).json({ success: true, message: 'Tạo tài khoản thành công', data: userResponse });
        } catch (error) {
            console.error('Lỗi tạo User (Admin):', error);
            res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    }

    // 3. Cập nhật User (Admin)
    async updateUserByAdmin(req, res) {
        try {
            const { id } = req.params;
            const { name, phone, role, isActive } = req.body;

            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
            }

            // Cập nhật thông tin
            if (name) user.name = name;
            if (phone !== undefined) user.phone = phone;
            if (role) user.role = role;
            if (isActive !== undefined) user.isActive = isActive;

            await user.save();

            const userResponse = user.toObject();
            delete userResponse.password;

            res.status(200).json({ success: true, message: 'Cập nhật tài khoản thành công', data: userResponse });
        } catch (error) {
            console.error('Lỗi cập nhật User (Admin):', error);
            res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    }
}

module.exports = new UserController();
