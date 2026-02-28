require('dotenv').config();
const app = require('./app');
const connectDB = require('./configs/db');

const PORT = process.env.PORT || 5000;

// Thực hiện kết nối Database trước
connectDB().then(() => {
    // Chỉ khi DB kết nối thành công thì mới mở port cho Frontend gọi tới
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
});