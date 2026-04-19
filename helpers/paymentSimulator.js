/**
 * 💳 Payment Simulator - Mode Simulation for Development/Testing
 * Simulates payment processing without real payment processors (Stripe, PayPal)
 */

const crypto = require('crypto');

// ✅ Configuration simulateur
const PAYMENT_CONFIG = {
    SUCCESS_RATE: 0.95,          // 95% de succès par défaut
    PROCESSING_TIME: 100,         // ms avant réponse
    AUTO_DECLINE_AMOUNTS: [666, 777, 888], // Montants qui échouent toujours
};

// ✅ Générateur de transaction ID
const generateTransactionId = () => {
    return 'SIM_' + crypto.randomBytes(12).toString('hex').toUpperCase();
};

// ✅ Simulateur de paiement
const simulatePayment = async (paymentRequest) => {
    const {
        userId,
        amount,
        currency = 'USD',
        paymentMethod = 'simulated_card',
        description = 'Course purchase'
    } = paymentRequest;

    // ✅ Simuler délai de traitement
    await new Promise(resolve => setTimeout(resolve, PAYMENT_CONFIG.PROCESSING_TIME));

    // ✅ Valider les paramètres
    if (!userId || !amount) {
        return {
            success: false,
            error: 'Missing required fields (userId, amount)',
            code: 'INVALID_REQUEST'
        };
    }

    // ✅ Montants qui échouent toujours (pour test)
    if (PAYMENT_CONFIG.AUTO_DECLINE_AMOUNTS.includes(amount)) {
        return {
            success: false,
            error: `Payment declined for amount ${amount} (test amount)`,
            code: 'INSUFFICIENT_FUNDS',
            transactionId: generateTransactionId(),
            timestamp: new Date()
        };
    }

    // ✅ Montants négatifs
    if (amount <= 0) {
        return {
            success: false,
            error: 'Amount must be positive',
            code: 'INVALID_AMOUNT',
            transactionId: generateTransactionId(),
            timestamp: new Date()
        };
    }

    // ✅ Simulation de succès/échec aléatoire
    const isSuccess = Math.random() < PAYMENT_CONFIG.SUCCESS_RATE;

    if (isSuccess) {
        return {
            success: true,
            transactionId: generateTransactionId(),
            amount,
            currency,
            paymentMethod,
            description,
            status: 'completed',
            timestamp: new Date(),
            receiptUrl: `https://receipts.example.com/${generateTransactionId()}`,
            metadata: {
                userId,
                simulatedAt: new Date().toISOString()
            }
        };
    } else {
        // ✅ Simulation d'erreurs courantes
        const errorCodes = [
            { code: 'INSUFFICIENT_FUNDS', message: 'Insufficient funds on account' },
            { code: 'CARD_DECLINED', message: 'Your card was declined' },
            { code: 'EXPIRED_CARD', message: 'Card has expired' },
            { code: 'INVALID_CVV', message: 'Invalid CVV code' },
            { code: 'PROCESSING_ERROR', message: 'Payment processor temporarily unavailable' }
        ];
        
        const error = errorCodes[Math.floor(Math.random() * errorCodes.length)];
        
        return {
            success: false,
            error: error.message,
            code: error.code,
            transactionId: generateTransactionId(),
            timestamp: new Date()
        };
    }
};

// ✅ Vérifier le statut d'une transaction simulée
const checkTransactionStatus = async (transactionId) => {
    // ✅ Les transactions simulées sont toujours complétées immédiatement
    if (!transactionId.startsWith('SIM_')) {
        return {
            status: 'unknown',
            error: 'Invalid simulated transaction ID'
        };
    }

    return {
        transactionId,
        status: 'completed',
        timestamp: new Date(),
        isSimulated: true
    };
};

// ✅ Refund simulé (pour tests de remboursement)
const simulateRefund = async (transactionId, amount = null) => {
    // ✅ Simuler délai de traitement
    await new Promise(resolve => setTimeout(resolve, PAYMENT_CONFIG.PROCESSING_TIME * 2));

    if (!transactionId.startsWith('SIM_')) {
        return {
            success: false,
            error: 'Invalid simulated transaction ID'
        };
    }

    // ✅ 90% de succès pour les refunds
    const isSuccess = Math.random() < 0.9;

    if (isSuccess) {
        return {
            success: true,
            refundId: 'REF_' + crypto.randomBytes(12).toString('hex').toUpperCase(),
            originalTransactionId: transactionId,
            amount,
            status: 'refunded',
            timestamp: new Date()
        };
    } else {
        return {
            success: false,
            error: 'Refund failed - transaction not found or already refunded',
            code: 'REFUND_FAILED',
            timestamp: new Date()
        };
    }
};

module.exports = {
    simulatePayment,
    checkTransactionStatus,
    simulateRefund,
    generateTransactionId,
    PAYMENT_CONFIG
};
