const express = require('express');
const router = express.Router();
const platformReviewController = require('../controllers/PlatformReview.controller');
const { authenticateToken } = require('../middlewares/auth');

// Ajouter/Modifier son avis plateforme
router.post('/add', authenticateToken, platformReviewController.addReview);

// Voir les avis récents (Public)
router.get('/recent', platformReviewController.getRecentReviews);

module.exports = router;
