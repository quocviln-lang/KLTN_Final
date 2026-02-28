const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

class OrderController {
    // [POST] Tạo Đơn Hàng Mới
    async createOrder(req, res) {
        try {
            const { items, shippingInfo, paymentMethod, totalAmount } = req.body;
            const userId = req.user._id;
            const userEmail = req.user.email;

            // 1. Kiểm tra Giỏ hàng rỗng
            if (!items || items.length === 0) {
                return res.status(400).json({ success: false, message: 'Đơn hàng không có sản phẩm nào' });
            }

            // 2. Kiểm tra tồn kho và Lấy importPrice để lưu (tính lợi nhuận)
            const orderItems = [];
            for (const item of items) {
                const product = await Product.findById(item.productId);
                
                if (!product) {
                    return res.status(404).json({ success: false, message: `Sản phẩm không tồn tại: ${item.name}` });
                }

                // Tìm variant chính xác
                const variant = product.variants.find(v => v._id.toString() === item.variantId);
                
                if (!variant) {
                     return res.status(404).json({ success: false, message: `Không tìm thấy phiên bản của sản phẩm: ${item.name}` });
                }

                if (variant.quantity < item.quantity) {
                     return res.status(400).json({ success: false, message: `Sản phẩm ${item.name} không đủ số lượng trong kho!` });
                }

                // Push vào mảng order items (có kẹp importPrice)
                orderItems.push({
                    productId: item.productId,
                    variantId: item.variantId,
                    name: item.name,
                    color: item.color,
                    storage: item.storage,
                    quantity: item.quantity,
                    price: item.price,
                    image: item.image,
                    importPrice: variant.importPrice // <-- Cực kỳ quan trọng để sau này xếp hạng doanh thu Admin
                });

                // Trừ đi số lượng trong kho thực tế của Product Variant
                variant.quantity -= item.quantity;
                await product.save(); // Lưu lại tồn kho mới
            }

            // 3. Tạo mã Đơn hàng (Order Code: Sinh ngẫu nhiên ví dụ TN-123456)
            const orderCode = `TN-${Math.floor(100000 + Math.random() * 900000)}`;

            // 4. Khởi tạo Order Mới
            // Dọn dẹp dữ liệu shipping từ form:
            const fullName = `${shippingInfo.lastName || ''} ${shippingInfo.firstName || ''}`.trim();
            
            const newOrder = new Order({
                orderCode,
                userId,
                email: shippingInfo.email || userEmail,
                items: orderItems,
                total: totalAmount,
                paymentMethod: paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 'Thanh toán Online',
                fullName: fullName || 'Khách hàng', // Fallback
                phone: shippingInfo.phone,
                shippingAddress: `${shippingInfo.address || ''}, phường/xã ${shippingInfo.ward || ''}, quận/huyện ${shippingInfo.district || ''}`.trim(),
                province: shippingInfo.city || 'Chưa cập nhật',
                region: 'Khác', // Tạm thời default, có thể mapping sau
                regionFee: 30000, // Hardcode fee cho demo
                status: 'waiting_approval' // Chờ duyệt
            });

            const savedOrder = await newOrder.save();

            // 5. Dọn dẹp Cart: Tìm giỏ hàng hiện tại và xóa hết những items vừa mua
            const cart = await Cart.findOne({ userId: userId });
            if (cart) {
                cart.items = []; // Xóa trắng rổ
                await cart.save();
            }

            // 6. Tặng 1 lượt quay vòng quay may mắn cho User khi đặt hàng thành công
            const User = require('../models/User');
            await User.findByIdAndUpdate(userId, { $inc: { spinCount: 1 } });

            // 7. Trả về Frontend
            res.status(201).json({
                success: true,
                message: 'Đặt hàng thành công!',
                data: savedOrder
            });

        } catch (error) {
            console.error('Lỗi khi Tạo Đơn Hàng:', error);
            // THU THẬP LOG RA FILE ĐỂ DEBUG
            try {
                const fs = require('fs');
                const path = require('path');
                const logPath = path.join(__dirname, '../../order_error.log');
                fs.appendFileSync(logPath, `\n\n[${new Date().toISOString()}] LỖI TẠO ĐƠN HÀNG:\n${error.stack || error.message}\nData nhận được: ${JSON.stringify(req.body)}`);
            } catch (e) {
                console.error("Lỗi khi ghi file log:", e);
            }
            res.status(500).json({ success: false, message: 'Đã xảy ra lỗi máy chủ khi xử lý Đơn hàng.', error: error.message });
        }
    }

    // ==========================================
    // CÁC HÀM DÀNH CHO KHÁCH HÀNG (USER/CLIENT)
    // ==========================================
    
    // [GET] Lấy danh sách Lịch sử mua hàng của User đang đăng nhập
    async getMyOrders(req, res) {
        try {
            const userId = req.user._id;
            
            // Tìm tất cả đơn hàng thuộc về userId này
            // Sắp xếp giảm dần theo thời gian tạo (Mới nhất lên đầu)
            const orders = await Order.find({ userId: userId }).sort({ createdAt: -1 });
            
            res.status(200).json({
                success: true,
                data: orders
            });
        } catch (error) {
            console.error('Lỗi khi lấy Lịch sử đơn hàng:', error);
            res.status(500).json({ success: false, message: 'Lỗi server khi lấy dữ liệu Lịch sử đơn hàng' });
        }
    }

    // ==========================================
    // CÁC HÀM DÀNH CHO ADMIN
    // ==========================================

    // [GET] Lấy danh sách Đơn hàng cho Admin (có lọc, tìm kiếm, phân trang)
    async getAdminOrders(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const search = req.query.search || '';
            const status = req.query.status || 'All Status';
            const startDate = req.query.startDate;
            const endDate = req.query.endDate;

            // Xây dựng điều kiện query
            let query = {};

            // 1. Lọc theo trạng thái
            if (status !== 'All Status') {
                // Ánh xạ từ Giao diện xuống DB
                const statusMap = {
                    'Processing': ['pending', 'paid'],
                    'Pending': ['waiting_approval'],
                    'Shipped': ['shipping'],
                    'Completed': ['done'],
                    'Cancelled': ['cancelled', 'unsuccessful']
                };
                
                if (statusMap[status]) {
                     query.status = { $in: statusMap[status] };
                }
            }

            // 2. Lọc theo Date Range
            if (startDate && endDate) {
                query.createdAt = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }

            // 3. Tìm kiếm theo Order Code hoặc Customer Name/Email
            if (search) {
                // Populate user logic trong tìm kiếm khá phức tạp với Mongoose.
                // Tạm thời sẽ tìm kiếm theo Mã Order, Tên khách nhận, Email khách nhận có sẵn trong bảng Order.
                query.$or = [
                    { orderCode: { $regex: search, $options: 'i' } },
                    { fullName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ];
            }

            const orders = await Order.find(query)
                .populate('userId', 'name avatar email') // Lấy bù thông tin User nếu cần
                .sort({ createdAt: -1 }) // Mới nhất lên đầu
                .skip(skip)
                .limit(limit);

            const total = await Order.countDocuments(query);

            res.status(200).json({
                success: true,
                data: orders,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            });

        } catch (error) {
            console.error('Lỗi khi lấy danh sách đơn hàng Admin:', error);
            res.status(500).json({ success: false, message: 'Lỗi server khi lấy dữ liệu Đơn hàng' });
        }
    }

    // [GET] Thống kê Dashboard Đơn hàng
    async getAdminOrderStats(req, res) {
        try {
            const totalOrders = await Order.countDocuments();
            const pendingOrders = await Order.countDocuments({ status: 'waiting_approval' });
            const shippedOrders = await Order.countDocuments({ status: 'shipping' });
            const cancelledOrders = await Order.countDocuments({ status: { $in: ['cancelled', 'unsuccessful'] } });

            res.status(200).json({
                success: true,
                data: {
                    totalOrders,
                    pendingOrders,
                    shippedOrders,
                    cancelledOrders
                }
            });
        } catch (error) {
             console.error('Lỗi tính Stats Đơn hàng Admin:', error);
             res.status(500).json({ success: false, message: 'Lỗi server khi tính Stats' });
        }
    }

    // [PUT] Cập nhật trạng thái Đơn hàng
    async updateOrderStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            // Chuyển đổi trạng thái từ FE -> DB (nếu cần thiết, hoặc FE gửi luôn mã DB)
            // Giả định FE sẽ gửi trực tiếp mã DB (pending, shipping, done...)
            const order = await Order.findByIdAndUpdate(
                id,
                { status: status },
                { new: true, runValidators: true }
            );

            if (!order) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy Đơn hàng' });
            }

            res.status(200).json({
                success: true,
                message: 'Cập nhật trạng thái thành công',
                data: order
            });
        } catch (error) {
            console.error('Lỗi cập nhật trạng thái đơn hàng:', error);
            res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật trạng thái' });
        }
    }
}

module.exports = new OrderController();
