const Promotion = require('../models/Promotion');

// 1. LẤY DANH SÁCH KHUYẾN MÃI (Admin lấy hết, Client lấy active kèm thông tin sản phẩm)
exports.getPromotions = async (req, res) => {
    try {
        const isAdmin = req.user && req.user.role === 'admin';
        const query = isAdmin ? {} : { isActive: true };

        const promotions = await Promotion.find(query)
            .populate('products', 'name images basePrice slug variants')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: promotions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách khuyến mãi' });
    }
};

// 2. LẤY DUY NHẤT 1 CHIẾN DỊCH FLASH SALE ĐANG HOẠT ĐỘNG (Dành cho Trang Home)
exports.getActiveFlashSale = async (req, res) => {
    try {
        const now = new Date();
        const flashSale = await Promotion.findOne({
            type: 'flashsale',
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        }).populate('products', 'name images basePrice slug variants');

        if (!flashSale) {
            return res.status(404).json({ success: false, message: 'Hiện không có Flash Sale nào' });
        }

        res.status(200).json({ success: true, data: flashSale });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy Flash Sale' });
    }
};

// 3. KIỂM TRA MÃ GIẢM GIÁ (Dùng cho Checkout)
exports.checkCoupon = async (req, res) => {
    try {
        const { code, orderTotal } = req.body;
        const promo = await Promotion.findOne({ code: code.toUpperCase(), isActive: true });

        if (!promo) {
            return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại hoặc đã hết hạn' });
        }

        // Kiểm tra thời hạn
        const now = new Date();
        if (now < promo.startDate || now > promo.endDate) {
            return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn sử dụng' });
        }

        // Kiểm tra lượt dùng
        if (promo.usedCount >= promo.usageLimit) {
            return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng' });
        }

        // Kiểm tra giá trị đơn hàng tối thiểu
        if (orderTotal < promo.minOrderValue) {
            return res.status(400).json({ 
                success: false, 
                message: `Đơn hàng tối thiểu ${promo.minOrderValue.toLocaleString()}đ mới được áp dụng mã này` 
            });
        }

        // TÍNH TOÁN SỐ TIỀN GIẢM
        let discountAmount = 0;
        if (promo.discountPercent > 0) {
            discountAmount = (orderTotal * promo.discountPercent) / 100;
            // Nếu có mức giảm tối đa, thì áp dụng mức trần
            if (promo.maxDiscount > 0 && discountAmount > promo.maxDiscount) {
                discountAmount = promo.maxDiscount;
            }
        } else {
            discountAmount = promo.discountedPrice;
        }

        res.status(200).json({ 
            success: true, 
            data: {
                code: promo.code,
                discountAmount,
                type: promo.type,
                title: promo.title
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi hệ thống khi kiểm tra mã' });
    }
};

// 4. TẠO KHUYẾN MÃI MỚI (Admin)
exports.createPromotion = async (req, res) => {
    try {
        const promo = await Promotion.create(req.body);
        res.status(201).json({ success: true, data: promo });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Mã giảm giá này đã tồn tại' });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

// 5. CẬP NHẬT KHUYẾN MÃI (Admin)
exports.updatePromotion = async (req, res) => {
    try {
        const promo = await Promotion.findByIdAndUpdate(req.params.id, req.body, {
            new: true, runValidators: true
        });
        if (!promo) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        res.status(200).json({ success: true, data: promo });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// 6. XÓA KHUYẾN MÃI (Admin)
exports.deletePromotion = async (req, res) => {
    try {
        const promo = await Promotion.findByIdAndDelete(req.params.id);
        if (!promo) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        res.status(200).json({ success: true, message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi xóa' });
    }
};