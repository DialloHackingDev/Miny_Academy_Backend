/**
 * 🔔 Notification Auto-Triggers Helper
 * Crée automatiquement des notifications pour événements clés
 */

const Notification = require('../models/Notification.model');
const { asyncHandler } = require('./errorHandler');

/**
 * 📧 Types d'événements notifications
 */
const NOTIFICATION_EVENTS = {
    COURSE_PURCHASED: 'COURSE_PURCHASED',
    REVIEW_POSTED: 'REVIEW_POSTED',
    NEW_COURSE: 'NEW_COURSE',
    STUDENT_ENROLLED: 'STUDENT_ENROLLED',
    COURSE_COMPLETED: 'COURSE_COMPLETED',
    PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
    PURCHASE_FAILED: 'PURCHASE_FAILED'
};

/**
 * ✅ Notifier un utilisateur
 * @param {ObjectId} userId - ID de l'utilisateur
 * @param {String} type - Type de notification
 * @param {Object} data - Données supplémentaires
 */
const createNotification = asyncHandler(async (userId, type, data = {}) => {
    try {
        // Construire le message basé sur le type
        let message = '';
        let actionUrl = '';

        switch(type) {
            case NOTIFICATION_EVENTS.COURSE_PURCHASED:
                message = `Vous avez acheté le cours: "${data.courseName}"`;
                actionUrl = `/course-player/${data.courseId}`;
                break;
            
            case NOTIFICATION_EVENTS.REVIEW_POSTED:
                message = `Nouvelle revue sur: "${data.courseName}"`;
                actionUrl = `/courses/${data.courseId}`;
                break;
            
            case NOTIFICATION_EVENTS.NEW_COURSE:
                message = `Nouveau cours disponible: "${data.courseName}"`;
                actionUrl = `/courses/${data.courseId}`;
                break;
            
            case NOTIFICATION_EVENTS.STUDENT_ENROLLED:
                message = `Nouvel étudiant inscrit: "${data.studentName}" à "${data.courseName}"`;
                actionUrl = `/course/${data.courseId}/students`;
                break;
            
            case NOTIFICATION_EVENTS.COURSE_COMPLETED:
                message = `Félicitations! Vous avez terminé: "${data.courseName}"`;
                actionUrl = `/course-player/${data.courseId}`;
                break;
            
            case NOTIFICATION_EVENTS.PAYMENT_RECEIVED:
                message = `Paiement reçu: ${data.amount} MAD pour "${data.courseName}"`;
                actionUrl = `/dashboard/sales`;
                break;
            
            case NOTIFICATION_EVENTS.PURCHASE_FAILED:
                message = `Votre paiement pour "${data.courseName}" a échoué`;
                actionUrl = `/cart`;
                break;
            
            default:
                message = data.message || 'Nouvelle notification';
        }

        // Créer la notification
        const notification = await Notification.create({
            userId,
            type,
            message,
            actionUrl,
            isRead: false,
            metadata: data
        });

        return notification;

    } catch (error) {
        // Ne pas lever l'erreur pour ne pas bloquer le flux principal
        console.error('❌ Erreur création notification:', error.message);
        return null;
    }
});

/**
 * ✅ Notifier multiple utilisateurs (par exemple tous les étudiants)
 */
const notifyMultipleUsers = asyncHandler(async (userIds, type, data) => {
    try {
        const notifications = userIds.map(userId => ({
            userId,
            type,
            message: data.message,
            actionUrl: data.actionUrl,
            isRead: false,
            metadata: data
        }));

        return await Notification.insertMany(notifications);
    } catch (error) {
        console.error('❌ Erreur bulk notifications:', error.message);
        return [];
    }
});

/**
 * ✅ Notifier le professeur d'un nouveau student
 */
const notifyProfessorNewStudent = asyncHandler(async (professorId, courseName, studentName, courseId) => {
    return await createNotification(
        professorId,
        NOTIFICATION_EVENTS.STUDENT_ENROLLED,
        {
            studentName,
            courseName,
            courseId
        }
    );
});

/**
 * ✅ Notifier l'acheteur du succès du paiement
 */
const notifyPurchaseSuccess = asyncHandler(async (userId, courseName, courseId) => {
    return await createNotification(
        userId,
        NOTIFICATION_EVENTS.COURSE_PURCHASED,
        {
            courseName,
            courseId
        }
    );
});

/**
 * ✅ Notifier l'acheteur de l'échec du paiement
 */
const notifyPurchaseFailure = asyncHandler(async (userId, courseName, error) => {
    return await createNotification(
        userId,
        NOTIFICATION_EVENTS.PURCHASE_FAILED,
        {
            courseName,
            error: error.message
        }
    );
});

/**
 * ✅ Notifier le professeur du paiement reçu
 */
const notifyPaymentReceived = asyncHandler(async (professorId, courseName, amount, courseId) => {
    return await createNotification(
        professorId,
        NOTIFICATION_EVENTS.PAYMENT_RECEIVED,
        {
            courseName,
            amount,
            courseId
        }
    );
});

/**
 * ✅ Notifier lors d'une nouvelle revue
 */
const notifyNewReview = asyncHandler(async (professorId, courseName, authorName, courseId) => {
    return await createNotification(
        professorId,
        NOTIFICATION_EVENTS.REVIEW_POSTED,
        {
            courseName,
            authorName,
            courseId
        }
    );
});

module.exports = {
    NOTIFICATION_EVENTS,
    createNotification,
    notifyMultipleUsers,
    notifyProfessorNewStudent,
    notifyPurchaseSuccess,
    notifyPurchaseFailure,
    notifyPaymentReceived,
    notifyNewReview
};
