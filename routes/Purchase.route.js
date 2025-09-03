const express = require('express');
const router = express.Router();
const roleCheck = require('../middlewares/roleCheck');
const purchaseController = require('../controllers/Purchase.controller');
const { param, validationResult } = require('express-validator');

// Simuler l'achat d'un cours
router.post(
	'/:courseId',
	roleCheck('student'),
	[
		param('courseId').isMongoId().withMessage('ID du cours invalide')
	],
	(req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		next();
	},
	purchaseController.buyCourse
);

// Lister les cours achetés par l'utilisateur connecté
router.get('/my-courses', roleCheck('student'), purchaseController.getMyCourses);

module.exports = router;
