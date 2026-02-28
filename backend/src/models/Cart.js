const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId }, // Để biết chính xác màu/dung lượng 
    name: { type: String, required: true },
    image: String,
    color: String,
    storage: String,
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 }
});

const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema],
    total: { type: Number, default: 0 }
}, { timestamps: true });

// ============================================================================
// TECH LEAD NÂNG CẤP: HOOK TỰ ĐỘNG TÍNH TỔNG TIỀN (AUTO-CALCULATE TOTAL)
// ============================================================================
// Mỗi khi giỏ hàng có sự thay đổi (thêm, bớt đồ) và gọi lệnh .save(), 
// MongoDB sẽ tự động chạy vòng lặp tính lại tổng tiền trước khi ghi vào Database.
// Việc này giúp Code ở Controller cực kỳ sạch sẽ và không bao giờ tính sai tiền.
cartSchema.pre('save', function (next) {
    this.total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    next();
});

module.exports = mongoose.model('Cart', cartSchema);