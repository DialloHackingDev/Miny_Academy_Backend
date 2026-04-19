const mongoose = require('../config/db');

const NotificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, minlength: 5, maxlength: 500 },
    type: { 
        type: String, 
        enum: [
            'system', 'course', 'inscription', 'progression', 'commentaire', 'nouvelle_leçon', 'general',
            'COURSE_PURCHASED', 'PURCHASE_FAILED', 'STUDENT_ENROLLED', 'PAYMENT_RECEIVED', 'REVIEW_POSTED'
        ], 
        default: 'general',
        required: true 
    },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

// ✅ Index pour requêtes rapides
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
