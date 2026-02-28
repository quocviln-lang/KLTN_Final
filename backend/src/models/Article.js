const mongoose = require('mongoose');
const slugify = require('slugify');

const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Tiêu đề bài viết là bắt buộc'],
        trim: true,
        maxlength: [200, 'Tiêu đề không được vượt quá 200 ký tự']
    },
    slug: {
        type: String,
        unique: true
    },
    category: {
        type: String,
        required: [true, 'Danh mục bài viết là bắt buộc'],
        enum: ['Công nghệ', 'Khuyến mãi', 'Đánh giá', 'Mẹo vặt', 'Tin tức chung'],
        default: 'Tin tức chung'
    },
    thumbnail: {
        type: String,
        required: [true, 'Ảnh bìa (thumbnail) là bắt buộc'],
        default: 'https://via.placeholder.com/800x450?text=No+Image'
    },
    content: {
        type: String,
        required: [true, 'Nội dung bài viết là bắt buộc']
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    views: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Middleware auto-generate slug before saving
articleSchema.pre('save', function() {
    if (this.isModified('title') || !this.slug) {
        // Create slug, handle Vietnamese characters
        this.slug = slugify(this.title, { 
            lower: true, 
            strict: true, 
            locale: 'vi' 
        }) + '-' + Math.floor(Math.random() * 1000);
    }
});

module.exports = mongoose.model('Article', articleSchema);
