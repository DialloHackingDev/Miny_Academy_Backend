// ✅ Routes du panier
const express = require('express');
const router = express.Router();
const { authenticateToken, requireStudent } = require('../middlewares/auth');
const cartController = require('../controllers/Cart.controller');
const { param, body, validationResult } = require('express-validator');

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

// ✅ Protéger toutes les routes
router.use(authenticateToken, requireStudent);

// ✅ GET /api/cart - Récupérer le panier actif
router.get('/', cartController.getCart);

// ✅ POST /api/cart/:courseId - Ajouter un cours au panier
router.post(
    '/:courseId',
    validateCourseId,
    cartController.addToCart
);

// ✅ DELETE /api/cart/:courseId - Retirer un cours du panier
router.delete(
    '/:courseId',
    validateCourseId,
    cartController.removeFromCart
);

// ✅ PATCH /api/cart/:courseId - Mettre à jour le panier
router.patch(
    '/:courseId',
    validateCourseId,
    body('quantity').optional().isInt({ min: 0 }).withMessage('Quantité invalide'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    },
    cartController.updateCart
);

// ✅ POST /api/cart/checkout - Passer la commande
router.post(
    '/checkout/process',
    body('paymentMethod')
        .optional()
        .isIn(['simulated_card', 'test_card'])
        .withMessage('Payment method invalide'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    },
    cartController.checkout
);

// ✅ DELETE /api/cart - Vider le panier
router.delete('/', cartController.clearCart);

// ✅ GET /api/cart/history - Historique des paniers
router.get('/history/all', cartController.getCartHistory);

module.exports = router;
