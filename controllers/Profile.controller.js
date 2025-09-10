// Contrôleur pour la gestion des profils utilisateurs
const User = require('../models/Users.model');
const bcrypt = require('bcryptjs');

// Récupérer les informations du profil de l'utilisateur connecté
exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Erreur lors de la récupération du profil', error: err.message });
    }
};

// Mettre à jour le profil de l'utilisateur
exports.updateUserProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { username, email, currentPassword, newPassword } = req.body;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        // Mise à jour des champs de base
        if (username) user.username = username;
        if (email) user.email = email;
        
        // Si l'utilisateur souhaite changer son mot de passe
        if (currentPassword && newPassword) {
            // Vérifier l'ancien mot de passe
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
            }
            
            // Hasher et enregistrer le nouveau mot de passe
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }
        
        await user.save();
        
        // Renvoyer l'utilisateur sans le mot de passe
        const updatedUser = await User.findById(userId).select('-password');
        res.json({ message: 'Profil mis à jour avec succès', user: updatedUser });
    } catch (err) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour du profil', error: err.message });
    }
};