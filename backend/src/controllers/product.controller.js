const Product = require('../models/Product');
const Promotion = require('../models/Promotion'); // <-- THÊM MỚI: Gọi Model Khuyến mãi

class ProductController {
    // 1. Lấy danh sách sản phẩm (ĐÃ NÂNG CẤP KÈM LOGIC TÍNH GIÁ KHUYẾN MÃI)
    static async getAllProducts(req, res) {
        try {
            // Dùng .lean() để chuyển data thành dạng Object thuần túy, dễ dàng thêm trường dữ liệu ảo
            const products = await Product.find().sort({ createdAt: -1 }).lean();

            // Lấy tất cả các chương trình khuyến mãi ĐANG CHẠY (Áp dụng cho sản phẩm)
            const now = new Date();
            const activePromotions = await Promotion.find({
                isActive: true,
                startDate: { $lte: now },
                endDate: { $gte: now },
                type: { $in: ['discount', 'flashsale'] }
            }).lean();

            // Gắn thông tin khuyến mãi và tính giá mới cho từng sản phẩm
            const enhancedProducts = products.map(product => {
                // Tìm xem sản phẩm này có nằm trong danh sách của chương trình khuyến mãi nào không
                const promo = activePromotions.find(p => 
                    p.products && p.products.some(id => id.toString() === product._id.toString())
                );

                if (promo) {
                    // Nếu có, gắn thông tin chiến dịch vào sản phẩm
                    product.activePromotion = {
                        title: promo.title,
                        type: promo.type,
                        discountPercent: promo.discountPercent,
                        discountedPrice: promo.discountedPrice,
                        isFlashSale: promo.isFlashSale
                    };

                    // Tự động tính giá sau khi giảm (salePrice)
                    let salePrice = product.basePrice || 0;
                    if (promo.discountPercent > 0) {
                        salePrice = salePrice - (salePrice * promo.discountPercent / 100);
                    } else if (promo.discountedPrice > 0) {
                        salePrice = salePrice - promo.discountedPrice;
                    }
                    
                    // Đảm bảo giá không bị âm
                    product.salePrice = salePrice > 0 ? salePrice : 0;
                }

                return product;
            });

            res.status(200).json({ success: true, data: enhancedProducts });
        } catch (error) {
            console.error("Lỗi GET Products:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // 2. Thêm sản phẩm mới (Đã thêm hệ thống soi lỗi chi tiết)
    static async createProduct(req, res) {
        try {
            console.log("=== BẮT ĐẦU TẠO SẢN PHẨM ===");
            console.log("1. Dữ liệu Frontend gửi lên (req.body):", req.body);

            // Cố gắng tạo sản phẩm
            const product = await Product.create(req.body);

            console.log("2. Đã lưu thành công vào Database!");
            res.status(201).json({ success: true, data: product });
        } catch (error) {
            console.error("!!! LỖI KHI TẠO SẢN PHẨM !!!");
            console.error(error);
            
            // Lỗi trùng lặp dữ liệu (Ví dụ: Trùng Slug)
            if (error.code === 11000) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Lỗi: Tên sản phẩm hoặc Slug này đã tồn tại trong hệ thống!' 
                });
            }

            // Lỗi do gửi thiếu thông tin bắt buộc
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(val => val.message);
                return res.status(400).json({ 
                    success: false, 
                    message: `Bạn điền thiếu thông tin: ${messages.join(', ')}` 
                });
            }

            // Các lỗi 500 khác
            res.status(500).json({ success: false, message: 'Lỗi máy chủ: ' + error.message });
        }
    }

    // 3. Cập nhật sản phẩm
    static async updateProduct(req, res) {
        try {
            const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
                new: true, runValidators: true
            });
            res.status(200).json({ success: true, data: product });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    // 4. Xóa sản phẩm
    static async deleteProduct(req, res) {
        try {
            await Product.findByIdAndDelete(req.params.id);
            res.status(200).json({ success: true, message: 'Đã xóa thành công' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = ProductController;