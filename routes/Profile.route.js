// Routes pour la gestion des profils utilisateurs
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const profileController = require('../controllers/Profile.controller');

// Récupérer le profil de l'utilisateur connecté
router.get('/', authenticateToken, profileController.getUserProfile);

// Mettre à jour le profil de l'utilisateur
router.put('/', authenticateToken, profileController.updateUserProfile);

module.exports = router;