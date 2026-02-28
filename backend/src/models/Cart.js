const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    variantId: {
        type: mongoose.Schema.Types.ObjectId // Lưu ID của biến thể (màu sắc, dung lượng)
    },
    name: { type: String, required: true },
    image: { type: String },
    color: { type: String },
    storage: { type: String },
    price: { type: Number, required: true }, // Giá tại thời điểm bỏ vào giỏ
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Số lượng không thể ít hơn 1'],
        default: 1
    }
});

const CartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Mỗi User chỉ có duy nhất 1 giỏ hàng
    },
    items: [cartItemSchema],
    total: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// PRE-SAVE HOOK: Tự động tính toán lại trường total trước khi lưu vào DB
// ĐÃ FIX: Xóa bỏ tham số next() để tránh xung đột luồng chạy của Mongoose v7/v8
CartSchema.pre('save', function () {
    this.total = this.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);
});

module.exports = mongoose.model('Cart', CartSchema);