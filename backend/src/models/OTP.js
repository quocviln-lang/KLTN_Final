const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    code: { type: String, required: true },
    type: { type: String, enum: ['reset_password'], required: true },
    target: { type: String, required: true }, // Email hoặc Phone
    expireAt: { type: Date, required: true },
    isUsed: { type: Boolean, default: false }
}, { timestamps: true });

// Tự động xóa OTP khi hết hạn (TTL Index)
otpSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OTP', otpSchema);