/**
 * ✅ Gestionnaire d'erreurs centralisé
 * Empêche l'exposition des stack traces au client
 * Messages génériques pour sécurité
 */

// ✅ Messages d'erreur prédéfinis (ne révèlent pas l'internals)
const ERROR_MESSAGES = {
    VALIDATION: "Les données fournies sont invalides",
    NOT_FOUND: "La ressource demandée n'a pas été trouvée",
    UNAUTHORIZED: "Vous n'êtes pas autorisé à accéder à cette ressource",
    FORBIDDEN: "Accès refusé",
    INTERNAL: "Une erreur serveur s'est produite. Veuillez réessayer.",
    DUPLICATE: "Cette ressource existe déjà",
    DATABASE: "Erreur de base de données. Veuillez réessayer.",
    INVALID_REQUEST: "La requête est invalide",
    EMAIL_EXISTS: "Cet email est déjà utilisé",
    PASSWORD_WEAK: "Le mot de passe ne respecte pas les critères de sécurité",
    COURSE_NOT_FOUND: "Le cours demandé n'existe pas",
    USER_NOT_FOUND: "L'utilisateur demandé n'existe pas",
    ALREADY_ENROLLED: "Vous êtes déjà inscrit à ce cours",
    FILE_UPLOAD_ERROR: "Erreur lors du téléchargement du fichier",
    PAYMENT_ERROR: "Le paiement n'a pas pu être traité. Veuillez réessayer."
};

// ✅ Enums pour les codes d'erreur cohérents
const ERROR_TYPES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
    UNAUTHORIZED_ERROR: 'UNAUTHORIZED_ERROR',
    FORBIDDEN_ERROR: 'FORBIDDEN_ERROR',
    DUPLICATE_ERROR: 'DUPLICATE_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    FILE_ERROR: 'FILE_ERROR',
    PAYMENT_ERROR: 'PAYMENT_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR'
};

// ✅ Logger les erreurs côté serveur SANS les exposer
const logError = (error, context = '') => {
    const timestamp = new Date().toISOString();
    console.error(`\n❌ [${timestamp}] ${context}`);
    console.error('Error Message:', error.message);
    console.error('Error Type:', error.name);
    if (error.stack) {
        console.error('Stack:', error.stack);
    }
};

// ✅ Envoyer erreur au client de manière sécurisée
const sendError = (res, statusCode, message, errorType = ERROR_TYPES.INTERNAL_ERROR) => {
    const response = {
        success: false,
        errorType,
        msg: message
    };

    // Ajouter les détails de validation si applicable
    if (statusCode === 400 && Array.isArray(message)) {
        response.msg = ERROR_MESSAGES.VALIDATION;
        response.validationErrors = message;
    }

    res.status(statusCode).json(response);
};

// ✅ Catégoriser les erreurs Mongoose
const handleMongooseError = (error) => {
    if (error.code === 11000) {
        // Duplicate key error
        return {
            statusCode: 409,
            message: ERROR_MESSAGES.DUPLICATE,
            errorType: ERROR_TYPES.DUPLICATE_ERROR
        };
    }
    
    if (error.name === 'ValidationError') {
        return {
            statusCode: 400,
            message: ERROR_MESSAGES.VALIDATION,
            errorType: ERROR_TYPES.VALIDATION_ERROR
        };
    }
    
    if (error.name === 'CastError') {
        return {
            statusCode: 400,
            message: ERROR_MESSAGES.INVALID_REQUEST,
            errorType: ERROR_TYPES.VALIDATION_ERROR
        };
    }

    return {
        statusCode: 500,
        message: ERROR_MESSAGES.DATABASE,
        errorType: ERROR_TYPES.DATABASE_ERROR
    };
};

// ✅ Wrapper pour éviter try-catch verbeux
class AppError extends Error {
    constructor(message, statusCode, errorType) {
        super(message);
        this.statusCode = statusCode;
        this.errorType = errorType;
    }
}

// ✅ Async wrapper pour les controllers
const asyncHandler = (fn) => {
    return (req, res, next) => {
        return Promise.resolve(fn(req, res, next)).catch((error) => {
            logError(error, `Async Wrapper: ${req.method} ${req.path}`);

            if (error instanceof AppError) {
                return sendError(res, error.statusCode, error.message, error.errorType);
            }

            // Gérer les erreurs Mongoose
            if (error.name && ['ValidationError', 'CastError'].includes(error.name)) {
                const mongoError = handleMongooseError(error);
                return sendError(res, mongoError.statusCode, mongoError.message, mongoError.errorType);
            }

            // Erreur générique (sécurisée)
            sendError(res, 500, ERROR_MESSAGES.INTERNAL, ERROR_TYPES.INTERNAL_ERROR);
        });
    };
};

module.exports = {
    ERROR_MESSAGES,
    ERROR_TYPES,
    AppError,
    asyncHandler,
    sendError,
    logError,
    handleMongooseError
};
