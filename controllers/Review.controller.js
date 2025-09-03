const Review = require('../models/Review.model');

module.exports = {
    // Ajouter ou modifier un avis
    addOrUpdateReview: async (req, res) => {
        const userId = req.user._id;
        const { courseId } = req.params;
        const { rating, comment } = req.body;
        try {
            let review = await Review.findOne({ userId, courseId });
            if (review) {
                review.rating = rating;
                review.comment = comment;
                review.date = Date.now();
                await review.save();
            } else {
                review = new Review({ userId, courseId, rating, comment });
                await review.save();
            }
            res.json({ message: 'Avis enregistré', review });
        } catch (err) {
            res.status(500).json({ message: 'Erreur avis', error: err.message });
        }
    },

    // Voir tous les avis d'un cours + note moyenne
    getCourseReviews: async (req, res) => {
        const { courseId } = req.params;
        try {
            const reviews = await Review.find({ courseId }).populate('userId', 'username');
            const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2) : null;
            res.json({ reviews, avgRating });
        } catch (err) {
            res.status(500).json({ message: 'Erreur récupération avis', error: err.message });
        }
    }
};
