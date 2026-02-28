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

// 7. CHƠI MINI-GAME (VÒNG QUAY MAY MẮN)
exports.playMinigame = async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.user._id);

        if (!user || user.spinCount <= 0) {
            return res.status(400).json({ success: false, message: 'Bạn đã hết lượt quay! Cần đặt thêm 1 đơn hàng để nhận 1 lượt quay nhé.' });
        }

        // 2. Thuật toán xác định phần thưởng ngẫu nhiên
        const prizes = [
            { name: 'Mã Giảm 10%', code: 'CYBER10', type: 'pct', value: 10, maxTotal: 100000, probability: 10, index: 0 },
            { name: 'Chúc bạn may mắn lần sau', code: '', type: 'none', probability: 35, index: 1 },
            { name: 'Mã Giảm 50K', code: 'CYBER50K', type: 'fixed', value: 50000, maxTotal: 50000, probability: 20, index: 2 },
            { name: 'Thêm 1 lượt quay', code: '+1SPIN', type: 'spin', probability: 10, index: 3 },
            { name: 'Chúc bạn may mắn lần sau', code: '', type: 'none', probability: 20, index: 4 },
            { name: 'Mã Giảm 100K', code: 'CYBER100K', type: 'fixed', value: 100000, maxTotal: 100000, probability: 5, index: 5 }
        ];

        // Random logic
        const rand = Math.random() * 100;
        let cumulative = 0;
        let wonPrize = prizes[1]; // Mặc định là chúc may mắn

        for (const prize of prizes) {
            cumulative += prize.probability;
            if (rand <= cumulative) {
                wonPrize = prize;
                break;
            }
        }

        // 1. Xử lý trừ lượt hoặc cộng lượt
        if (wonPrize.type === 'spin') {
            // Trúng thêm 1 lượt quay => spinCount giữ nguyên (hoặc trừ đi 1 rồi cộng 1 = không đổi)
            // Lượt quay cũ - 1 + 1 = Lượt quay cũ
        } else {
            user.spinCount -= 1;
        }
        await user.save();

        // 3. Tự động thêm Code vào CSDL nếu mã chưa tồn tại (Dành cho mã voucher xịn)
        if (wonPrize.code && wonPrize.type !== 'none' && wonPrize.type !== 'spin') {
            const existingPromo = await Promotion.findOne({ code: wonPrize.code });
            if (!existingPromo) {
                const now = new Date();
                const nextMonth = new Date(now);
                nextMonth.setMonth(now.getMonth() + 1);
                
                await Promotion.create({
                    title: wonPrize.name,
                    description: `Phần thưởng từ vòng quay Cyber Spin cho ${wonPrize.name}`,
                    code: wonPrize.code,
                    type: 'voucher',
                    discountPercent: wonPrize.type === 'pct' ? wonPrize.value : 0,
                    discountedPrice: wonPrize.type === 'fixed' ? wonPrize.value : 0,
                    maxDiscount: wonPrize.maxTotal,
                    minOrderValue: 0, // Không yêu cầu giá trị tối thiểu
                    usageLimit: 10000, // Cấp xả láng
                    startDate: now,
                    endDate: nextMonth,
                    isActive: true
                });
            }
        }

        // Trả về cho frontend
        res.status(200).json({
            success: true,
            data: {
                wonPrize,
                remainingSpins: user.spinCount
            }
        });

    } catch (error) {
        console.error('Lỗi khi quay Vòng quay:', error);
        res.status(500).json({ success: false, message: 'Đã xảy ra lỗi hệ thống' });
    }
};

// 8. THÊM LƯỢT QUAY TEST (Chỉ dùng cho môi trường test/demo)
exports.addTestSpins = async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.user._id);
        if(!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        user.spinCount += 10;
        await user.save();
        
        res.status(200).json({ success: true, spinCount: user.spinCount });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};