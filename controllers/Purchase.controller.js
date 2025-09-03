const Purchase = require('../models/Purchase.model');
const Course = require('../models/Cours.model');

module.exports = {
    // Simuler l'achat d'un cours
    buyCourse: async (req, res) => {
        const userId = req.user._id;
        const { courseId } = req.params;
        try {
            // Vérifier si déjà acheté
            let purchase = await Purchase.findOne({ userId, courseId });
            if (purchase) return res.status(400).json({ message: 'Cours déjà acheté.' });
            purchase = new Purchase({ userId, courseId, paymentStatus: 'paid' });
            await purchase.save();
            res.json({ message: 'Achat simulé réussi', purchase });
        } catch (err) {
            res.status(500).json({ message: 'Erreur achat', error: err.message });
        }
    },

    // Lister les cours achetés
    getMyCourses: async (req, res) => {
        const userId = req.user._id;
        try {
            const purchases = await Purchase.find({ userId, paymentStatus: 'paid' }).populate('courseId');
            const courses = purchases.map(p => p.courseId);
            res.json({ courses });
        } catch (err) {
            res.status(500).json({ message: 'Erreur récupération cours achetés', error: err.message });
        }
    }
};
