//la partie purchase
const express = require('express');
const router = express.Router();
const { authenticateToken, requireStudent } = require('../middlewares/auth');
const purchaseController = require('../controllers/Purchase.controller');
const { param, validationResult } = require('express-validator');

// ✅ Middleware validation pour courseId
const validateCourseId = [
    param('courseId').isMongoId().withMessage('ID du cours invalide'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    }
];

// ✅ Acheter un cours
router.post(
    '/:courseId',
    authenticateToken,
    requireStudent,
    validateCourseId,
    purchaseController.buyCourse
);

// ✅ Récupérer mes cours achetés
router.get('/my-courses', authenticateToken, requireStudent, purchaseController.getMyCourses);

// ✅ Récupérer l'historique des achats (Admin)
router.get('/history/admin', authenticateToken, purchaseController.getPurchaseHistory);

// ✅ Vérifier si utilisateur a acheté un cours
router.get(
    '/check/:courseId',
    authenticateToken,
    validateCourseId,
    purchaseController.hasUserPurchased
);

module.exports = router;
