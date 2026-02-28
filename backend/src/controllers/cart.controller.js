const Cart = require('../models/Cart');
const Product = require('../models/Product');

// 1. LẤY GIỎ HÀNG CỦA USER
exports.getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ userId: req.user.id });
        
        // Nếu User chưa có giỏ hàng, tự động tạo mới
        if (!cart) {
            cart = await Cart.create({ userId: req.user.id, items: [], total: 0 });
        }

        res.status(200).json({ success: true, data: cart });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy giỏ hàng' });
    }
};

// 2. THÊM SẢN PHẨM VÀO GIỎ
exports.addToCart = async (req, res) => {
    try {
        const { productId, variantId, name, image, color, storage, price, quantity } = req.body;
        const userId = req.user.id;

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        // Kiểm tra xem sản phẩm cùng biến thể (variantId) đã có trong giỏ chưa
        const itemIndex = cart.items.findIndex(item => 
            item.productId.toString() === productId && 
            (variantId ? item.variantId?.toString() === variantId : true)
        );

        if (itemIndex > -1) {
            // Nếu đã tồn tại: Cộng dồn số lượng
            cart.items[itemIndex].quantity += quantity;
        } else {
            // Nếu chưa tồn tại: Thêm item mới
            cart.items.push({ productId, variantId, name, image, color, storage, price, quantity });
        }

        // Lệnh .save() sẽ kích hoạt middleware pre-save để tính lại tổng tiền
        await cart.save();
        res.status(200).json({ success: true, data: cart });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi thêm vào giỏ hàng' });
    }
};

// 3. CẬP NHẬT SỐ LƯỢNG ITEM TRONG GIỎ
exports.updateCartItem = async (req, res) => {
    try {
        const { itemId, quantity } = req.body; // itemId là _id của dòng trong mảng items
        const cart = await Cart.findOne({ userId: req.user.id });

        if (!cart) return res.status(404).json({ success: false, message: 'Giỏ hàng không tồn tại' });

        const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex === -1) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm trong giỏ' });

        // Cập nhật số lượng mới
        cart.items[itemIndex].quantity = quantity;

        await cart.save();
        res.status(200).json({ success: true, data: cart });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi cập nhật số lượng' });
    }
};

// 4. XÓA MỘT SẢN PHẨM KHỎI GIỎ
exports.removeFromCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) return res.status(404).json({ success: false, message: 'Giỏ hàng không tồn tại' });

        // Lọc bỏ item cần xóa
        cart.items = cart.items.filter(item => item._id.toString() !== req.params.itemId);

        await cart.save();
        res.status(200).json({ success: true, message: 'Đã xóa sản phẩm khỏi giỏ hàng', data: cart });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi xóa sản phẩm' });
    }
};