const mongoose = require('../config/db');

const PurchaseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    paymentStatus: { type: String, enum: ['paid', 'pending'], default: 'paid' },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Purchase', PurchaseSchema);
