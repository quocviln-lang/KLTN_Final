const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true }, // Bổ sung URL thân thiện
    type: { type: String, trim: true },
    isActive: { type: Boolean, default: true } // Bổ sung trạng thái
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);