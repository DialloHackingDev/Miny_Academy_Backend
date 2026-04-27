//la partie progression 
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const progressionController = require('../controllers/Progression.controller');
const { param, body, validationResult } = require('express-validator');

// ✅ Middleware de validation
const validateLessonCompletion = [
    param('courseId').isMongoId().withMessage('ID du cours invalide'),
    param('lessonId').isMongoId().withMessage('ID de la leçon invalide'),
    body('timeSpent').optional().isInt({ min: 0 }).withMessage('timeSpent doit être un nombre positif'),
    body('score').optional().isInt({ min: 0, max: 100 }).withMessage('score doit être entre 0 et 100'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    }
];

// ✅ Marquer une leçon comme complétée
router.post(
    '/:courseId/:lessonId',
    authenticateToken,
    validateLessonCompletion,
    progressionController.markLessonCompleted
);

// ✅ Récupérer la progression d'un utilisateur sur un cours
router.get(
    '/:courseId',
    authenticateToken,
    [
        param('courseId').isMongoId().withMessage('ID du cours invalide'),
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }
            next();
        }
    ],
    progressionController.getProgression
);

// ✅ BONUS: Récupérer TOUS les progressions de l'utilisateur
router.get(
    '/',
    authenticateToken,
    progressionController.getUserProgress
);

// ✅ BONUS: Réinitialiser la progression d'un cours
router.delete(
    '/:courseId',
    authenticateToken,
    [
        param('courseId').isMongoId().withMessage('ID du cours invalide'),
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }
            next();
        }
    ],
    progressionController.resetProgression
);

// ✅ Vérification publique de certificat (SANS TOKEN)
router.get(
    '/verify/:courseId/:userId',
    progressionController.verifyPublicCertificate
);

module.exports = router;
