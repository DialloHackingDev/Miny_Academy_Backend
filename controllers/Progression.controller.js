const Progression = require('../models/Progression.model');
const Course = require('../models/Cours.model');

module.exports = {
    // Marquer une leçon comme vue
    markLessonCompleted: async (req, res) => {
        const userId = req.user._id;
        const { courseId, lessonId } = req.params;
        try {
            // Récupérer ou créer la progression
            let progression = await Progression.findOne({ userId, courseId });
            if (!progression) {
                progression = new Progression({ userId, courseId, completedLessons: [] });
            }
            // Ajouter la leçon si pas déjà vue
            if (!progression.completedLessons.includes(lessonId)) {
                progression.completedLessons.push(lessonId);
            }
            // Calculer le pourcentage
            const course = await Course.findById(courseId);
            const totalLessons = course.content.split('\n').length; // à adapter selon structure réelle
            progression.progressPercentage = Math.round((progression.completedLessons.length / totalLessons) * 100);
            await progression.save();
            res.json({ message: 'Leçon marquée comme vue', progression });
        } catch (err) {
            res.status(500).json({ message: 'Erreur progression', error: err.message });
        }
    },

    // Récupérer la progression
    getProgression: async (req, res) => {
        const userId = req.user._id;
        const { courseId } = req.params;
        try {
            const progression = await Progression.findOne({ userId, courseId });
            if (!progression) return res.json({ progressPercentage: 0, completedLessons: [] });
            res.json({ progressPercentage: progression.progressPercentage, completedLessons: progression.completedLessons });
        } catch (err) {
            res.status(500).json({ message: 'Erreur récupération progression', error: err.message });
        }
    }
};
