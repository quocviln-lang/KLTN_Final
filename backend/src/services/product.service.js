const Product = require('../models/Product');

class ProductService {
    // 1. Dành cho Admin: Thêm sản phẩm mới
    static async createProduct(data) {
        // Kiểm tra xem slug (đường dẫn URL) đã bị trùng chưa
        const existingProduct = await Product.findOne({ slug: data.slug });
        if (existingProduct) {
            const error = new Error('Đường dẫn (slug) sản phẩm này đã tồn tại!');
            error.status = 400;
            throw error;
        }

        // Tạo sản phẩm mới vào DB
        const newProduct = await Product.create(data);
        return newProduct;
    }

    // 2. Dành cho Khách hàng: Lấy danh sách sản phẩm
    static async getAllProducts(query) {
        // Tạm thời lấy tất cả sản phẩm đang ở trạng thái kích hoạt (isActive: true)
        // (Sau này chúng ta sẽ nâng cấp hàm này để thêm Lọc, Tìm kiếm và Phân trang)
        const products = await Product.find({ isActive: true })
            .select('-__v') // Ẩn các trường không cần thiết của MongoDB
            .sort({ createdAt: -1 }); // Mới nhất lên đầu

        return products;
    }
}

module.exports = ProductService;