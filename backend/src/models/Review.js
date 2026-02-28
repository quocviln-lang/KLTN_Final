const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    // 1. LIÊN KẾT DỮ LIỆU
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    
    // Đã đồng bộ tên biến với model User
    userName: { type: String, required: true },
    userAvatar: { type: String }, 

    // 2. NỘI DUNG ĐÁNH GIÁ (Có hỗ trợ Upload Ảnh)
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    images: [{ type: String }], 

    // 3. ADMIN PHẢN HỒI
    adminReply: { type: String, trim: true },
    repliedAt: { type: Date },

    // 4. TƯƠNG TÁC (LIKE / DISLIKE)
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    dislikedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // 5. TRẠNG THÁI KIỂM DUYỆT
    status: { type: String, enum: ['active', 'hidden'], default: 'active' }
}, { timestamps: true });

// LÁ CHẮN THÉP CHỐNG SPAM: Ép buộc 1 User chỉ được review 1 Product đúng 1 lần
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);