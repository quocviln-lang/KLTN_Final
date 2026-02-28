const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Kết nối dựa trên URI lấy từ file .env
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB Connected Successfully on: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Lỗi kết nối MongoDB: ${error.message}`);
        process.exit(1); // Dừng hoàn toàn server nếu không kết nối được DB
    }
};

module.exports = connectDB;