const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    code: { 
        type: String, 
        unique: true, 
        sparse: true, 
        trim: true,
        uppercase: true 
    },
    type: { 
        type: String, 
        enum: ['discount', 'gift', 'voucher', 'flashsale'], 
        default: 'discount' 
    },
    
    // NÂNG CẤP: Cho phép chọn nhiều sản phẩm áp dụng khuyến mãi này
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    
    // Cờ đánh dấu để đẩy lên trang Home phần Flash Sale
    isFlashSale: { type: Boolean, default: false },

    discountPercent: { type: Number, default: 0 },
    discountedPrice: { type: Number, default: 0 },
    minOrderValue: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 0 },
    usageLimit: { type: Number, default: 100 },
    usedCount: { type: Number, default: 0 },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    image: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model('Promotion', promotionSchema);