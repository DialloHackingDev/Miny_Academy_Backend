const PlatformReview = require('../models/PlatformReview.model');

const platformReviewController = {
    addReview: async (req, res) => {
        try {
            const { rating, comment } = req.body;
            const userId = req.user.id;

            // Vérifier si l'utilisateur a déjà laissé un avis
            const existing = await PlatformReview.findOne({ userId });
            if (existing) {
                existing.rating = rating;
                existing.comment = comment;
                existing.date = Date.now();
                await existing.save();
                return res.json({ success: true, message: 'Avis plateforme mis à jour', review: existing });
            }

            const newReview = new PlatformReview({ userId, rating, comment });
            await newReview.save();
            res.json({ success: true, message: 'Avis plateforme ajouté', review: newReview });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Erreur ajout avis plateforme', error: err.message });
        }
    },

    getRecentReviews: async (req, res) => {
        try {
            const reviews = await PlatformReview.find()
                .sort({ date: -1 })
                .limit(6)
                .populate('userId', 'username profileImage');
            res.json({ success: true, reviews });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Erreur récupération avis plateforme', error: err.message });
        }
    }
};

module.exports = platformReviewController;
