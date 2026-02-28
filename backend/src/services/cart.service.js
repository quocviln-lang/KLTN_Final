const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');

class CartService {
    // Tìm hoặc tạo giỏ hàng mới
    async getOrCreateCart(userId) {
        let cart = await Cart.findOne({ userId }).populate('items.productId');
        
        if (!cart) {
            cart = await Cart.create({ userId, items: [], total: 0 });
            return cart;
        }

        // ================= CẬP NHẬT LẠI GIÁ TRỊ THỰC TẾ =================
        // Dò qua toàn bộ sản phẩm xem giá có thay đổi (hết Sale, hoặc có Sale mới)
        let priceChanged = false;
        const now = new Date();

        for (let item of cart.items) {
            const product = item.productId;
            if (!product) continue;

            let basePrice = product.basePrice;

            // 1. Lấy giá theo biến thể hoặc giá gốc
            if (item.variantId) {
                const variant = product.variants.id(item.variantId);
                if (variant) basePrice = variant.price || product.basePrice;
            }

            // 2. Kiểm tra khuyến mãi hiện tại cho sản phẩm này
            const activePromo = await Promotion.findOne({
                isActive: true,
                startDate: { $lte: now },
                endDate: { $gte: now },
                type: { $in: ['discount', 'flashsale'] },
                products: product._id
            });

            // 3. Tính toán lại giá trị cuối cùng hiện có của sản phẩm
            let currentPrice = basePrice;
            if (activePromo) {
                if (activePromo.discountPercent > 0) {
                    currentPrice = basePrice - (basePrice * activePromo.discountPercent / 100);
                } else if (activePromo.discountedPrice > 0) {
                    currentPrice = basePrice - activePromo.discountedPrice;
                }
                if (currentPrice < 0) currentPrice = 0;
            }

            // 4. Nếu giá hiện tại khác giá đang lưu cứng trong DB => Cập nhật lại Giỏ
            if (item.price !== currentPrice) {
                item.price = currentPrice;
                priceChanged = true;
            }
        }

        // Nếu có sự chênh lệch (tức giá đã bị sửa đổi), ta gọi save() để Mongoose tự lưu và tính lại "total"
        if (priceChanged) {
            await cart.save();
        }
        
        return cart;
    }

    // Logic thêm sản phẩm (ĐÃ FIX: Cập nhật cỗ máy tính giá Khuyến mãi)
    async addItem(userId, { productId, variantId, quantity }) {
        const product = await Product.findById(productId);
        if (!product) throw new Error('Sản phẩm không tồn tại!');

        let basePrice = product.basePrice;
        let stock = 0;
        let selectedVariant = null;

        // Ưu tiên lấy giá và kho của biến thể
        if (variantId) {
            selectedVariant = product.variants.id(variantId);
            if (!selectedVariant) throw new Error('Biến thể không tồn tại!');
            basePrice = selectedVariant.price || product.basePrice;
            stock = selectedVariant.quantity;
        } else {
            stock = 100; // Giả định cho sản phẩm không biến thể
        }

        // ================= TÍNH TOÁN GIÁ KHUYẾN MÃI (CHỐT CHẶN BACKEND) =================
        const now = new Date();
        const activePromo = await Promotion.findOne({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
            type: { $in: ['discount', 'flashsale'] },
            products: product._id
        });

        let finalPrice = basePrice;
        if (activePromo) {
            if (activePromo.discountPercent > 0) {
                finalPrice = basePrice - (basePrice * activePromo.discountPercent / 100);
            } else if (activePromo.discountedPrice > 0) {
                finalPrice = basePrice - activePromo.discountedPrice;
            }
            if (finalPrice < 0) finalPrice = 0;
        }
        // =================================================================================

        if (stock < quantity) throw new Error(`Chỉ còn ${stock} sản phẩm trong kho!`);

        let cart = await Cart.findOne({ userId });
        if (!cart) cart = new Cart({ userId, items: [] });

        const itemIndex = cart.items.findIndex(item => 
            item.productId.toString() === productId && 
            (item.variantId ? item.variantId.toString() === variantId?.toString() : !variantId)
        );

        if (itemIndex > -1) {
            const newQty = cart.items[itemIndex].quantity + quantity;
            if (newQty > stock) throw new Error('Vượt quá tồn kho cho phép!');
            
            cart.items[itemIndex].quantity = newQty;
            // LUÔN CẬP NHẬT LẠI GIÁ MỚI NHẤT KHI KHÁCH THÊM HÀNG TỒN VÀO GIỎ
            cart.items[itemIndex].price = finalPrice; 
        } else {
            cart.items.push({
                productId, 
                variantId, 
                price: finalPrice, // SỬ DỤNG GIÁ ĐÃ GIẢM
                quantity,
                name: product.name,
                image: selectedVariant?.image || product.images[0],
                color: selectedVariant?.color,
                storage: selectedVariant?.storage
            });
        }

        return await cart.save();
    }

    // Cập nhật số lượng
    async updateItemQuantity(userId, itemId, quantity) {
        const cart = await Cart.findOne({ userId });
        const item = cart?.items.id(itemId);
        if (!item) throw new Error('Không tìm thấy sản phẩm trong giỏ!');

        const product = await Product.findById(item.productId);
        let stock = item.variantId ? product.variants.id(item.variantId).quantity : 100;

        if (quantity > stock) throw new Error('Vượt quá tồn kho!');
        
        item.quantity = quantity;
        return await cart.save();
    }

    // Xóa item
    async removeItem(userId, itemId) {
        const cart = await Cart.findOne({ userId });
        if (!cart) throw new Error('Giỏ hàng không tồn tại!');
        cart.items = cart.items.filter(item => item._id.toString() !== itemId);
        return await cart.save();
    }
}

module.exports = new CartService();