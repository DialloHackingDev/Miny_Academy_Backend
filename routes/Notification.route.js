//la partie notification
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const notificationController = require('../controllers/Notification.controller');
const { body, param, validationResult } = require('express-validator');

// ✅ Middleware validation pour notifications
const validateNotification = [
    param('userId').isMongoId().withMessage('ID utilisateur invalide'),
    body('message').notEmpty().isLength({ max: 500 }).withMessage('message est requis (max 500 chars)'),
    body('type').isIn(['inscription', 'progression', 'commentaire', 'nouvelle_leçon', 'general']).withMessage('Type invalide'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    }
];

// ✅ Créer une notification (Admin uniquement)
router.post('/:userId', authenticateToken, validateNotification, notificationController.createNotification);

// ✅ Récupérer les notifications de l'utilisateur connecté
router.get('/', authenticateToken, notificationController.getMyNotifications);

// ✅ Marquer une notification comme lue
router.patch('/:id', authenticateToken, notificationController.markAsRead);

// ✅ Marquer TOUTES les notifications comme lues
router.patch('/', authenticateToken, notificationController.markAllAsRead);

// ✅ Supprimer une notification
router.delete('/:id', authenticateToken, notificationController.deleteNotification);

// ✅ Supprimer TOUTES les notifications
router.delete('/', authenticateToken, notificationController.deleteAllNotifications);

module.exports = router;
