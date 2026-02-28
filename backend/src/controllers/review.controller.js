const Review = require('../models/Review');
const User = require('../models/User');

// 1. LẤY DANH SÁCH REVIEW CỦA 1 SẢN PHẨM (Client)
exports.getProductReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ 
            productId: req.params.productId,
            status: 'active' 
        }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: reviews.length, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy đánh giá' });
    }
};

// 2. TẠO ĐÁNH GIÁ MỚI (User)
exports.createReview = async (req, res) => {
    try {
        const { productId, rating, comment, images } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);

        const newReview = await Review.create({
            userId,
            productId,
            userName: user.name,
            userAvatar: user.avatar,
            rating,
            comment,
            images: images || []
        });

        res.status(201).json({ success: true, data: newReview });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Bạn đã đánh giá sản phẩm này rồi! Mỗi sản phẩm chỉ được đánh giá 1 lần.' });
        }
        res.status(500).json({ success: false, message: 'Lỗi server khi gửi đánh giá' });
    }
};

// 3. SỬA ĐÁNH GIÁ (User)
exports.updateReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });

        // Kiểm tra xem người đang sửa có phải là chủ nhân của đánh giá không
        if (review.userId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền sửa đánh giá này!' });
        }

        const { rating, comment, images } = req.body;
        review.rating = rating || review.rating;
        review.comment = comment || review.comment;
        if (images) review.images = images; // Cập nhật lại mảng ảnh nếu có

        await review.save();
        res.status(200).json({ success: true, message: 'Cập nhật thành công', data: review });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi sửa đánh giá' });
    }
};

// 4. XÓA ĐÁNH GIÁ (User hoặc Admin)
exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });

        // Admin có thể xóa mọi đánh giá, nhưng User chỉ được xóa đánh giá của chính mình
        if (review.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa đánh giá này!' });
        }

        await review.deleteOne();
        res.status(200).json({ success: true, message: 'Đã xóa đánh giá thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi xóa đánh giá' });
    }
};

// 5. THẢ LIKE CHO REVIEW (User)
exports.toggleLike = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });

        const userId = req.user.id;
        const isLiked = review.likedBy.includes(userId);

        if (isLiked) {
            review.likedBy.pull(userId);
        } else {
            review.likedBy.push(userId);
            review.dislikedBy.pull(userId);
        }

        await review.save();
        res.status(200).json({ success: true, data: review });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi thao tác Like' });
    }
};

// 6. THẢ DISLIKE CHO REVIEW (User)
exports.toggleDislike = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });

        const userId = req.user.id;
        const isDisliked = review.dislikedBy.includes(userId);

        if (isDisliked) {
            review.dislikedBy.pull(userId);
        } else {
            review.dislikedBy.push(userId);
            review.likedBy.pull(userId);
        }

        await review.save();
        res.status(200).json({ success: true, data: review });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi thao tác Dislike' });
    }
};

// 7. LẤY TẤT CẢ ĐÁNH GIÁ TOÀN HỆ THỐNG (Dành riêng cho Admin)
exports.getAllReviews = async (req, res) => {
    try {
        // Populate productId để Admin biết đánh giá này thuộc về Sản phẩm nào
        const reviews = await Review.find()
            .populate('productId', 'name slug images')
            .sort({ createdAt: -1 });
            
        res.status(200).json({ success: true, count: reviews.length, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách đánh giá' });
    }
};

// 8. ADMIN PHẢN HỒI (Admin)
exports.replyReview = async (req, res) => {
    try {
        const { adminReply } = req.body;
        const review = await Review.findById(req.params.id);

        if (!review) return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });

        review.adminReply = adminReply;
        review.repliedAt = Date.now();
        
        await review.save();
        res.status(200).json({ success: true, message: 'Phản hồi thành công', data: review });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi gửi phản hồi' });
    }
};