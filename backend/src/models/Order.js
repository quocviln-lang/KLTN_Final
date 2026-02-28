const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    variantId: { type: mongoose.Schema.Types.ObjectId },
    name: String,
    color: String,
    storage: String,
    quantity: Number,
    price: Number,
    importPrice: { type: Number, required: true }, // Để tính lợi nhuận cho Admin
    image: String
});

const orderSchema = new mongoose.Schema({
    orderCode: { type: String, unique: true }, // Thêm để tra cứu (Ví dụ: ORD-123456)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: { type: String, required: true },
    items: [orderItemSchema],
    total: { type: Number, required: true },
    paymentMethod: { type: String, default: 'COD' },
    
    // Thông tin giao hàng
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    shippingAddress: { type: String, required: true },
    province: { type: String, required: true },
    region: { type: String, enum: ['Miền Bắc', 'Miền Trung', 'Miền Nam', 'Khác'], default: 'Khác' },
    
    // Các loại phí
    regionFee: { type: Number, default: 0 },
    methodFee: { type: Number, default: 0 },
    warrantyFee: { type: Number, default: 0 },
    
    status: { 
        type: String, 
        enum: ['waiting_approval', 'pending', 'paid', 'shipping', 'done', 'unsuccessful', 'cancelled'], 
        default: 'waiting_approval' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);