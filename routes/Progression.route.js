//la partie progression 
const express = require('express');
const router = express.Router();
const { authenticateToken, requireStudent } = require('../middlewares/auth');
const progressionController = require('../controllers/Progression.controller');

// Marquer une leçon comme vue
router.post('/:courseId/:lessonId', authenticateToken, requireStudent, progressionController.markLessonCompleted);

// Récupérer la progression d'un utilisateur sur un cours
router.get('/:courseId', authenticateToken, requireStudent, progressionController.getProgression);

module.exports = router;
