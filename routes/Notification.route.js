const express = require('express');
const router = express.Router();
const roleCheck = require('../middlewares/roleCheck');
const notificationController = require('../controllers/Notification.controller');

// Créer une notification
router.post('/:userId', roleCheck('admin'), notificationController.createNotification);

// Récupérer les notifications de l'utilisateur connecté
router.get('/', notificationController.getMyNotifications);

// Marquer une notification comme lue
router.patch('/:id', notificationController.markAsRead);

module.exports = router;
