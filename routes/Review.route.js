
//la partie reviews
const express = require('express');
const router = express.Router();
const { authenticateToken, requireStudent } = require('../middlewares/auth');
const reviewController = require('../controllers/Review.controller');
const { body, validationResult } = require('express-validator');

// Ajouter ou modifier un avis
router.post(
	'/:courseId',
	authenticateToken,
	requireStudent,
	[
		body('rating').isInt({ min: 1, max: 5 }).withMessage('La note doit être entre 1 et 5'),
		body('comment').notEmpty().withMessage('Le commentaire est obligatoire')
	],
	(req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		next();
	},
	reviewController.addOrUpdateReview
);

// Voir tous les avis d'un cours
router.get('/:courseId', reviewController.getCourseReviews);

module.exports = router;
