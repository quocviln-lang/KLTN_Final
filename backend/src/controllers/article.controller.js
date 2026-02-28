const Article = require('../models/Article');
const slugify = require('slugify');

// 1. GET ALL (Lấy danh sách bài viết)
// Hỗ trợ phân trang, lọc theo danh mục
exports.getArticles = async (req, res) => {
    try {
        const { page = 1, limit = 10, category, search } = req.query;
        
        // Nếu là user thường, chỉ lấy bài đang hiển thị. Admin thì lấy hết
        let query = {};
        if (!req.user || req.user.role !== 'admin') {
            query.isPublished = true;
        }

        if (category) {
            query.category = category;
        }

        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const articles = await Article.find(query)
            .populate('author', 'name avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Article.countDocuments(query);

        res.status(200).json({
            success: true,
            data: articles,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error in getArticles:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy tin tức' });
    }
};

// 2. GET SINGLE (Chi tiết bài báo)
exports.getArticleBySlug = async (req, res) => {
    try {
        const article = await Article.findOne({ slug: req.params.slug })
            .populate('author', 'name avatar');
            
        if (!article) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });

        // Tăng lượt xem (không đợi await để tránh chậm request)
        Article.findByIdAndUpdate(article._id, { $inc: { views: 1 } }).exec();

        res.status(200).json({ success: true, data: article });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// 3. CREATE (Admin)
exports.createArticle = async (req, res) => {
    try {
        // Gắn author là ID của admin đang tạo
        const articleData = { ...req.body, author: req.user._id };
        const article = await Article.create(articleData);
        
        res.status(201).json({ success: true, data: article });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// 4. UPDATE (Admin)
exports.updateArticle = async (req, res) => {
    try {
        // Cập nhật lại slug thủ công nếu title thay đổi
        if (req.body.title) {
             req.body.slug = slugify(req.body.title, { lower: true, strict: true, locale: 'vi' }) 
                + '-' + Math.floor(Math.random() * 1000);
        }

        const article = await Article.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!article) return res.status(404).json({ success: false, message: 'Bài viết không tồn tại' });
        
        res.status(200).json({ success: true, data: article });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// 5. DELETE (Admin)
exports.deleteArticle = async (req, res) => {
    try {
        const article = await Article.findByIdAndDelete(req.params.id);
        if (!article) return res.status(404).json({ success: false, message: 'Bài viết không tồn tại' });
        
        res.status(200).json({ success: true, message: 'Đã xóa bài viết thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi xóa' });
    }
};
