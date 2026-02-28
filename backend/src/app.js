const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// 1. Middlewares (Cấu hình bảo mật và parse dữ liệu)
app.use(helmet()); // Bảo vệ HTTP headers
app.use(morgan('dev')); // Log lịch sử request ra terminal
app.use(cors()); // Cho phép Frontend gọi API mà không bị lỗi CORS
app.use(express.json()); // Giúp server đọc được dữ liệu JSON từ body request

// 2. Routes
const routes = require('./routes/index');
app.use('/api', routes); // Mọi API đều bắt đầu bằng chữ /api

// 3. Xử lý lỗi 404 (Không tìm thấy route)
app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});

// 4. Global Error Handler (Nơi tập trung xử lý mọi lỗi của hệ thống)
app.use((error, req, res, next) => {
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal Server Error'
    });
});

module.exports = app;