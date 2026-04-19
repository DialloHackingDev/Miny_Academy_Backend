const Purchase = require('../models/Purchase.model');
const Course = require('../models/Cours.model');
const { asyncHandler, ERROR_TYPES, sendError, logError } = require('../helpers/errorHandler');

module.exports = {
    // ✅ Acheter un cours
    buyCourse: asyncHandler(async (req, res) => {
        const userId = req.user._id || req.user.id;
        const { courseId } = req.params;

        // ✅ Vérifier que le cours existe
        const course = await Course.findById(courseId);
        if (!course) {
            return sendError(res, 404, "Le cours demandé n'existe pas", ERROR_TYPES.NOT_FOUND_ERROR);
        }

        // ✅ Vérifier si déjà acheté
        let purchase = await Purchase.findOne({ userId, courseId });
        if (purchase) {
            return sendError(res, 409, "Vous avez déjà acheté ce cours", ERROR_TYPES.DUPLICATE_ERROR);
        }

        // ✅ Créer l'achat
        purchase = new Purchase({
            userId,
            courseId,
            paymentStatus: 'paid',
            price: course.price,  // ✅ Enregistrer le prix à l'achat
            date: new Date()
        });

        await purchase.save();

        // ✅ Ajouter l'utilisateur à la liste des students du cours (utiliser update)
        await Course.findByIdAndUpdate(
            courseId,
            { $addToSet: { students: userId } },
            { new: true }
        );

        res.status(201).json({
            success: true,
            msg: "Achat effectué avec succès",
            data: purchase
        });
    }),

    // ✅ Récupérer les cours achetés de l'utilisateur
    getMyCourses: asyncHandler(async (req, res) => {
        const userId = req.user._id || req.user.id;

        const purchases = await Purchase.find({
            userId,
            paymentStatus: 'paid'
        })
            .populate({
                path: 'courseId',
                select: 'title description price professor stats',
                populate: {
                    path: 'professor',
                    select: 'username email'
                }
            })
            .sort({ date: -1 });

        // ✅ Formater les données
        const courses = purchases.map(p => ({
            purchaseId: p._id,
            courseId: p.courseId._id,
            courseName: p.courseId.title,
            description: p.courseId.description,
            price: p.price,
            purchasedAt: p.date,
            professor: p.courseId.professor ? {
                id: p.courseId.professor._id,
                username: p.courseId.professor.username,
                email: p.courseId.professor.email
            } : null,
            stats: p.courseId.stats
        }));

        res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        });
    }),

    // ✅ BONUS: Récupérer l'historique des achats (admin)
    getPurchaseHistory: asyncHandler(async (req, res) => {
        if (req.user.role !== 'admin') {
            return sendError(res, 403, "Accès refusé", ERROR_TYPES.FORBIDDEN_ERROR);
        }

        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const purchases = await Purchase.find()
            .populate('userId', 'username email')
            .populate('courseId', 'title')
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Purchase.countDocuments();

        res.status(200).json({
            success: true,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            },
            data: purchases
        });
    }),

    // ✅ BONUS: Vérifier si utilisateur a acheté un cours
    hasUserPurchased: asyncHandler(async (req, res) => {
        const userId = req.user._id || req.user.id;
        const { courseId } = req.params;

        const purchase = await Purchase.findOne({
            userId,
            courseId,
            paymentStatus: 'paid'
        });

        res.status(200).json({
            success: true,
            purchased: !!purchase,
            purchaseDate: purchase ? purchase.date : null
        });
    })
};
