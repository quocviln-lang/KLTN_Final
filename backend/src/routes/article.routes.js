const express = require('express');
const router = express.Router();
const {
    getArticles,
    getArticleBySlug,
    createArticle,
    updateArticle,
    deleteArticle
} = require('../controllers/article.controller');

const { protect, authorize } = require('../middlewares/auth.middleware');

// ================= PUBLIC ROUTES =================
router.get('/', getArticles);
router.get('/:slug', getArticleBySlug);

// ================= ADMIN ROUTES =================
router.post('/', protect, authorize('admin'), createArticle);
router.put('/:id', protect, authorize('admin'), updateArticle);
router.delete('/:id', protect, authorize('admin'), deleteArticle);

module.exports = router;
