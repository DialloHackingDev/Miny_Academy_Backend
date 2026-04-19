const mongoose = require('../config/db');

const PurchaseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    price: { type: Number, default: 0 }, // ✅ Prix payé (snapshot du moment de l'achat)
    paymentStatus: { type: String, enum: ['paid', 'pending', 'failed'], default: 'paid' },
    paymentMethod: { type: String, default: 'free' }, // 'free', 'stripe', 'paypal', etc.
    transactionId: { type: String }, // ID de la transaction externe (Stripe, PayPal, etc.)
    date: { type: Date, default: Date.now },
    expiresAt: { type: Date } // Optionnel: date d'expiration de l'accès
}, { timestamps: true });

// ✅ Index pour optimiser requêtes
PurchaseSchema.index({ userId: 1, courseId: 1 });
PurchaseSchema.index({ userId: 1, paymentStatus: 1 });
PurchaseSchema.index({ date: -1 });

module.exports = mongoose.model('Purchase', PurchaseSchema);
