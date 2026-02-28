const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

class AdminService {
    static async getDashboardStats() {
        // 1. Tính tổng doanh thu từ các đơn hàng đã giao (Giả sử có model Order)
        // Nếu bạn chưa có model Order, tôi sẽ để mặc định là 0 để không bị lỗi code
        const totalRevenue = 0; 

        // 2. Đếm tổng số đơn hàng
        const totalOrders = 0; 

        // 3. Đếm tổng số khách hàng (Role là user)
        const totalCustomers = await User.countDocuments({ role: 'user' });

        // 4. Đếm tổng số sản phẩm
        const totalProducts = await Product.countDocuments();

        // 5. Lấy 5 giao dịch gần nhất (Mock data cho đến khi làm xong module Order)
        const recentOrders = [];

        return {
            totalRevenue,
            totalOrders,
            totalCustomers,
            totalProducts,
            recentOrders
        };
    }
}

module.exports = AdminService;