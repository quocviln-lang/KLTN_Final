const mongoose = require('mongoose');
const slugify = require('slugify');

const variantSchema = new mongoose.Schema({
    color: String,
    storage: String,
    size: String,
    price: { type: Number },
    importPrice: Number,
    quantity: { type: Number, min: 0, default: 0 },
    image: String
});

const productSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Vui lòng nhập tên sản phẩm'], trim: true },
    slug: { type: String, unique: true },
    brand: String,
    
    // NÂNG CẤP: Đoạn mô tả chi tiết & 3 Highlights
    description: String, 
    highlights: [{ type: String, trim: true }], // Lưu 3 dòng ưu điểm nổi bật
    
    // NÂNG CẤP: Sẵn sàng cho Bộ sưu tập nhiều ảnh
    images: [String], 
    
    type: String,
    basePrice: { type: Number, required: [true, 'Vui lòng nhập giá cơ bản'] },
    variants: [variantSchema],
    specs: [{
        key: { type: String, trim: true },
        value: { type: String, trim: true }
    }],
    compatibleWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    tags: [{ type: String, trim: true }],
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// LOGIC TỰ ĐỘNG TẠO SLUG
productSchema.pre('save', function () {
    if (this.name && this.isModified('name')) {
        this.slug = slugify(this.name, {
            lower: true,
            strict: true,
            locale: 'vi'
        });
    }
});

module.exports = mongoose.model('Product', productSchema);