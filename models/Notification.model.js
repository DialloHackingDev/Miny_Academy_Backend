const mongoose = require('../config/db');

const NotificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['inscription', 'progression', 'commentaire', 'nouvelle_leçon'], required: true },
    status: { type: String, enum: ['lu', 'non_lu'], default: 'non_lu' },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
