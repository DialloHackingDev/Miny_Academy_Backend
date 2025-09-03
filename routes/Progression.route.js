const express = require('express');
const router = express.Router();
const roleCheck = require('../middlewares/roleCheck');
const progressionController = require('../controllers/Progression.controller');

// Marquer une leçon comme vue
router.post('/:courseId/:lessonId', roleCheck('student'), progressionController.markLessonCompleted);

// Récupérer la progression d'un utilisateur sur un cours
router.get('/:courseId', roleCheck('student'), progressionController.getProgression);

module.exports = router;
