const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Tên dịch vụ không được để trống'], 
        trim: true 
    },
    description: { 
        type: String, 
        trim: true 
    },
    type: { 
        type: String, 
        enum: ['warranty', 'shipping', 'other'], 
        required: true 
    },
    price: { 
        type: Number, 
        required: true, 
        default: 0 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);