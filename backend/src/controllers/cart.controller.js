const CartService = require('../services/cart.service');

class CartController {
    async getCart(req, res) {
        try {
            const cart = await CartService.getOrCreateCart(req.user._id);
            res.status(200).json({ success: true, data: cart });
        } catch (error) {
            console.error('Error in getCart:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async addToCart(req, res) {
        try {
            const cart = await CartService.addItem(req.user._id, req.body);
            res.status(200).json({ success: true, data: cart });
        } catch (error) {
            console.error('Error in addToCart:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async updateQuantity(req, res) {
        try {
            const { itemId, quantity } = req.body;
            const cart = await CartService.updateItemQuantity(req.user._id, itemId, quantity);
            res.status(200).json({ success: true, data: cart });
        } catch (error) {
            console.error('Error in updateQuantity:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async removeItem(req, res) {
        try {
            const cart = await CartService.removeItem(req.user._id, req.params.itemId);
            res.status(200).json({ success: true, data: cart });
        } catch (error) {
            console.error('Error in removeItem:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

// Xuất ra một instance để đảm bảo các hàm là function hợp lệ
module.exports = new CartController();