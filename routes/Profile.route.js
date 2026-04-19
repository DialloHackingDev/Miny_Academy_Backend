// Routes pour la gestion des profils utilisateurs
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const { uploadProfileImage } = require('../middlewares/upload');
const ProfileController = require('../controllers/Profile.controller');

// Récupérer le profil de l'utilisateur connecté
router.get('/', authenticateToken, ProfileController.getUserProfile);

// Mettre à jour le profil de l'utilisateur (avec upload d'image optionnel)
router.put('/', authenticateToken, uploadProfileImage, ProfileController.updateUserProfile);

module.exports = router;