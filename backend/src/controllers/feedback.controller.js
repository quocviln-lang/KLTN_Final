const Feedback = require('../models/Feedback');

// 1. Gửi phản hồi (Public cho khách hàng)
exports.createFeedback = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin!' });
        }

        const feedback = await Feedback.create({ name, email, message });

        res.status(201).json({ 
            success: true, 
            message: 'Phản hồi của bạn đã được gửi. Chúng tôi sẽ liên hệ trong thời gian sớm nhất!',
            data: feedback 
        });
    } catch (error) {
        console.error('Lỗi khi gửi phản hồi:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi gửi phản hồi' });
    }
};

// 2. Lấy danh sách phản hồi (Dành cho Admin)
exports.getFeedbacks = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const feedbacks = await Feedback.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Feedback.countDocuments();

        res.status(200).json({
            success: true,
            data: feedbacks,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Lỗi lấy danh sách phản hồi:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// 3. Xóa phản hồi (Dành cho Admin)
exports.deleteFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.findByIdAndDelete(req.params.id);
        if (!feedback) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phản hồi' });
        }
        res.status(200).json({ success: true, message: 'Đã xóa phản hồi thành công' });
    } catch (error) {
        console.error('Lỗi xóa phản hồi:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
