const Notification = require('../models/Notification.model');

module.exports = {
    // Créer une notification
    createNotification: async (req, res) => {
        const { userId } = req.params;
        const { message, type } = req.body;
        try {
            const notif = new Notification({ userId, message, type });
            await notif.save();
            res.json({ message: 'Notification créée', notif });
        } catch (err) {
            res.status(500).json({ message: 'Erreur création notification', error: err.message });
        }
    },

    // Récupérer les notifications de l'utilisateur connecté
    getMyNotifications: async (req, res) => {
        const userId = req.user._id;
        try {
            const notifs = await Notification.find({ userId }).sort({ date: -1 });
            res.json({ notifications: notifs });
        } catch (err) {
            res.status(500).json({ message: 'Erreur récupération notifications', error: err.message });
        }
    },

    // Marquer une notification comme lue
    markAsRead: async (req, res) => {
        const { id } = req.params;
        try {
            const notif = await Notification.findById(id);
            if (!notif) return res.status(404).json({ message: 'Notification non trouvée' });
            notif.status = 'lu';
            await notif.save();
            res.json({ message: 'Notification marquée comme lue', notif });
        } catch (err) {
            res.status(500).json({ message: 'Erreur maj notification', error: err.message });
        }
    }
};
