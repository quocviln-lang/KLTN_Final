const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    fullName: String,
    phone: String,
    province: String,
    district: String,
    ward: String,
    detail: String,
    isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: String,
    
    // NÂNG CẤP: Bổ sung avatar để phục vụ cho hệ thống Review và Profile sau này
    avatar: { 
        type: String, 
        default: 'https://via.placeholder.com/150?text=User' 
    },
    
    role: { 
        type: String, 
        enum: ['user', 'admin', 'staff'], 
        default: 'user' 
    },
    addresses: [addressSchema],
    wishlist: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        addedAt: { type: Date, default: Date.now }
    }],
    payMethods: [{
        type: { type: String },
        provider: String,
        accountNumber: String,
        isDefault: { type: Boolean, default: false }
    }],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);