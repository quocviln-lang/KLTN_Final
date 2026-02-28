const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');

// Khi Frontend gọi POST tới /register, chạy hàm register trong Controller
router.post('/register', AuthController.register);

// Khi Frontend gọi POST tới /login, chạy hàm login trong Controller
router.post('/login', AuthController.login);

module.exports = router;