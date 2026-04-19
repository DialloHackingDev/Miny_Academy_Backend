const Notification = require('../models/Notification.model');
const User = require('../models/Users.model');
const { asyncHandler, ERROR_TYPES, sendError, logError } = require('../helpers/errorHandler');

module.exports = {
    // ✅ Créer une notification (Admin)
    createNotification: asyncHandler(async (req, res) => {
        // Vérifier que c'est un admin
        if (req.user.role !== 'admin') {
            return sendError(res, 403, "Seuls les admins peuvent créer des notifications", ERROR_TYPES.FORBIDDEN_ERROR);
        }

        const { userId } = req.params;
        const { message, type } = req.body;

        // ✅ Validation
        if (!message || !type) {
            return sendError(res, 400, "message et type sont requis", ERROR_TYPES.VALIDATION_ERROR);
        }

        const validTypes = ['system', 'course', 'inscription', 'progression', 'commentaire', 'nouvelle_leçon', 'general'];
        if (!validTypes.includes(type)) {
            return sendError(res, 400, "Type de notification invalide", ERROR_TYPES.VALIDATION_ERROR);
        }

        // ✅ Vérifier que l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return sendError(res, 404, "L'utilisateur demandé n'existe pas", ERROR_TYPES.NOT_FOUND_ERROR);
        }

        // ✅ Créer la notification
        const notif = new Notification({
            userId,
            message: message.substring(0, 500), // Limiter à 500 caractères
            type,
            isRead: false,
            date: new Date()
        });

        await notif.save();

        res.status(201).json({
            success: true,
            msg: "Notification créée avec succès",
            data: notif
        });
    }),

    // ✅ Récupérer les notifications de l'utilisateur connecté
    getMyNotifications: asyncHandler(async (req, res) => {
        const userId = req.user._id || req.user.id;
        const { page = 1, limit = 20, unreadOnly = false } = req.query;
        const skip = (page - 1) * limit;

        // ✅ Construire la requête
        const query = { userId };
        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        // ✅ Récupérer avec pagination
        const notifs = await Notification.find(query)
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({ userId, isRead: false });

        res.status(200).json({
            success: true,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            },
            unreadCount,
            notifications: notifs
        });
    }),

    // ✅ Marquer une notification comme lue
    markAsRead: asyncHandler(async (req, res) => {
        const userId = req.user._id || req.user.id;
        const { id } = req.params;

        // ✅ Vérifier que la notification existe
        const notif = await Notification.findById(id);
        if (!notif) {
            return sendError(res, 404, "La notification n'existe pas", ERROR_TYPES.NOT_FOUND_ERROR);
        }

        // ✅ Vérifier que c'est sa propre notification
        if (notif.userId.toString() !== userId.toString()) {
            return sendError(res, 403, "Vous ne pouvez marquer que vos propres notifications", ERROR_TYPES.FORBIDDEN_ERROR);
        }

        // ✅ Marquer comme lue
        notif.isRead = true;
        notif.readAt = new Date();
        await notif.save();

        res.status(200).json({
            success: true,
            msg: "Notification marquée comme lue",
            data: notif
        });
    }),

    // ✅ Marquer TOUTES les notifications comme lues
    markAllAsRead: asyncHandler(async (req, res) => {
        const userId = req.user._id || req.user.id;

        await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        res.status(200).json({
            success: true,
            msg: "Toutes les notifications marquées comme lues",
            data: {}
        });
    }),

    // ✅ Supprimer une notification
    deleteNotification: asyncHandler(async (req, res) => {
        const userId = req.user._id || req.user.id;
        const { id } = req.params;

        // ✅ Vérifier propriété
        const notif = await Notification.findById(id);
        if (!notif) {
            return sendError(res, 404, "La notification n'existe pas", ERROR_TYPES.NOT_FOUND_ERROR);
        }

        if (notif.userId.toString() !== userId.toString()) {
            return sendError(res, 403, "Vous ne pouvez supprimer que vos propres notifications", ERROR_TYPES.FORBIDDEN_ERROR);
        }

        // ✅ Supprimer
        await Notification.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            msg: "Notification supprimée",
            data: { id }
        });
    }),

    // ✅ Supprimer TOUTES les notifications de l'utilisateur
    deleteAllNotifications: asyncHandler(async (req, res) => {
        const userId = req.user._id || req.user.id;

        await Notification.deleteMany({ userId });

        res.status(200).json({
            success: true,
            msg: "Toutes les notifications supprimées",
            data: {}
        });
    })
};
