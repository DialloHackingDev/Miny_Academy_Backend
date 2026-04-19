const Cart = require('../models/Cart.model');
const Course = require('../models/Cours.model');
const Purchase = require('../models/Purchase.model');
const { asyncHandler, ERROR_TYPES, sendError } = require('../helpers/errorHandler');
const { simulatePayment, generateTransactionId } = require('../helpers/paymentSimulator');
const {
    notifyPurchaseSuccess,
    notifyPurchaseFailure,
    notifyProfessorNewStudent,
    notifyPaymentReceived
} = require('../helpers/notificationTrigger');

module.exports = {
    // ✅ Ajouter un cours au panier
    addToCart: asyncHandler(async (req, res) => {
        const userId = req.user._id || req.user.id;
        const { courseId } = req.params;

        // ✅ Vérifier que le cours existe
        const course = await Course.findById(courseId);
        if (!course) {
            return sendError(res, 404, "Le cours n'existe pas", ERROR_TYPES.NOT_FOUND_ERROR);
        }

        // ✅ Vérifier que l'utilisateur n'a pas déjà acheté ce cours
        const purchased = await Purchase.findOne({ userId, courseId, paymentStatus: 'paid' });
        if (purchased) {
            return sendError(res, 409, "Vous avez déjà acheté ce cours", ERROR_TYPES.DUPLICATE_ERROR);
        }

        // ✅ Récupérer ou créer le panier actif
        let cart = await Cart.findOne({ userId, status: 'active' });
        if (!cart) {
            cart = new Cart({
                userId,
                items: [],
                status: 'active'
            });
        }

        // ✅ Vérifier si le cours est déjà dans le panier
        const itemExists = cart.items.find(item => item.courseId.toString() === courseId.toString());
        if (itemExists) {
            return sendError(res, 409, "Ce cours est déjà dans votre panier", ERROR_TYPES.DUPLICATE_ERROR);
        }

        // ✅ Ajouter le cours au panier
        cart.items.push({
            courseId,
            courseName: course.title,
            price: course.price || 0
        });

        await cart.save();

        res.status(201).json({
            success: true,
            msg: "Cours ajouté au panier",
            data: cart
        });
    }),

    // ✅ Retirer un cours du panier
    removeFromCart: asyncHandler(async (req, res) => {
        const userId = req.user._id || req.user.id;
        const { courseId } = req.params;

        // ✅ Trouver le panier
        const cart = await Cart.findOne({ userId, status: 'active' });
        if (!cart) {
            return sendError(res, 404, "Panier non trouvé", ERROR_TYPES.NOT_FOUND_ERROR);
        }

        // ✅ Retirer le cours
        cart.items = cart.items.filter(item => item.courseId.toString() !== courseId.toString());

        // ✅ Si panier vide, le supprimer
        if (cart.items.length === 0) {
            await Cart.findByIdAndDelete(cart._id);
            return res.status(200).json({
                success: true,
                msg: "Cours retiré du panier (panier maintenant vide)",
                data: null
            });
        }

        await cart.save();

        res.status(200).json({
            success: true,
            msg: "Cours retiré du panier",
            data: cart
        });
    }),

    // ✅ Récupérer le panier de l'utilisateur
    getCart: asyncHandler(async (req, res) => {
        const userId = req.user._id || req.user.id;

        let cart = await Cart.findOne({ userId, status: 'active' });

        if (!cart) {
            return res.status(200).json({
                success: true,
                msg: "Panier vide",
                data: {
                    userId,
                    items: [],
                    totalPrice: 0,
                    itemCount: 0
                }
            });
        }

        // ✅ Populate courses
        cart = await cart.populate('items.courseId');

        // ✅ Formater la réponse
        const cartData = {
            cartId: cart._id,
            userId: cart.userId,
            items: cart.items.map(item => ({
                itemId: item._id,
                courseId: item.courseId._id,
                courseName: item.courseName,
                description: item.courseId.description,
                price: item.price,
                professor: item.courseId.professor,
                addedAt: item.addedAt
            })),
            totalPrice: cart.totalPrice,
            itemCount: cart.items.length,
            status: cart.status,
            expiresAt: cart.expiresAt
        };

        res.status(200).json({
            success: true,
            data: cartData
        });
    }),

    // ✅ Mettre à jour la quantité (ou supprimer via quantity: 0)
    updateCart: asyncHandler(async (req, res) => {
        const userId = req.user._id || req.user.id;
        const { courseId } = req.params;
        const { quantity } = req.body;

        const cart = await Cart.findOne({ userId, status: 'active' });
        if (!cart) {
            return sendError(res, 404, "Panier non trouvé", ERROR_TYPES.NOT_FOUND_ERROR);
        }

        // ✅ Supprimer si quantity = 0
        if (quantity === 0 || quantity === undefined) {
            cart.items = cart.items.filter(item => item.courseId.toString() !== courseId.toString());
        } else if (quantity > 0) {
            const item = cart.items.find(item => item.courseId.toString() === courseId.toString());
            if (!item) {
                return sendError(res, 404, "Cours non trouvé dans le panier", ERROR_TYPES.NOT_FOUND_ERROR);
            }
            // Note: Pour courses, quantity est généralement 1, mais on peut ajouter pour future extensibilité
            // item.quantity = quantity;
        } else {
            return sendError(res, 400, "Quantité invalide", ERROR_TYPES.VALIDATION_ERROR);
        }

        if (cart.items.length === 0) {
            await Cart.findByIdAndDelete(cart._id);
            return res.status(200).json({
                success: true,
                msg: "Panier vidé",
                data: null
            });
        }

        await cart.save();

        res.status(200).json({
            success: true,
            msg: "Panier mis à jour",
            data: cart
        });
    }),

    // ✅ Checkout - Passer la commande avec paiement simulé
    checkout: asyncHandler(async (req, res) => {
        const userId = req.user._id || req.user.id;
        const { paymentMethod = 'simulated_card' } = req.body;

        // ✅ Récupérer le panier
        const cart = await Cart.findOne({ userId, status: 'active' });
        if (!cart || cart.items.length === 0) {
            return sendError(res, 400, "Panier vide", ERROR_TYPES.VALIDATION_ERROR);
        }

        // ✅ Vérifier que tous les cours existent toujours
        for (const item of cart.items) {
            const course = await Course.findById(item.courseId);
            if (!course) {
                return sendError(res, 404, `Le cours "${item.courseName}" n'existe plus`, ERROR_TYPES.NOT_FOUND_ERROR);
            }
        }

        // ✅ Processus de paiement simulé
        const paymentRequest = {
            userId,
            amount: cart.totalPrice,
            currency: 'USD',
            paymentMethod,
            description: `Purchase of ${cart.items.length} course(s)`
        };

        const paymentResult = await simulatePayment(paymentRequest);

        if (!paymentResult.success) {
            // ✅ Paiement échoué - Notifier l'utilisateur
            for (const item of cart.items) {
                await notifyPurchaseFailure(userId, item.courseName, paymentResult.error || new Error('Payment declined'));
                // 📧 Email d'échec de paiement
                await sendPaymentFailedEmail(
                    req.user.email,
                    req.user.username || req.user.email,
                    item.courseName,
                    paymentResult.error || 'Payment declined'
                );
            }
            return sendError(res, 402, `Paiement échoué: ${paymentResult.error}`, ERROR_TYPES.PAYMENT_ERROR);
        }

        // ✅ Paiement réussi - Créer les purchases
        const purchases = [];
        for (const item of cart.items) {
            const purchase = new Purchase({
                userId,
                courseId: item.courseId,
                price: item.price,
                paymentStatus: 'paid',
                paymentMethod: 'simulated',
                transactionId: paymentResult.transactionId,
                date: new Date()
            });

            await purchase.save();
            purchases.push(purchase);

            // ✅ Ajouter l'utilisateur aux étudiants du cours
            const course = await Course.findById(item.courseId);
            if (course) {
                // ✅ Ajouter student au cours
                if (!course.students.includes(userId)) {
                    course.students.push(userId);
                    await course.save();
                }

                // 🔔 Notifier l'étudiant
                await notifyPurchaseSuccess(userId, item.courseName, courseId = item.courseId.toString());

                // � Email de confirmation d'achat
                await sendPurchaseConfirmationEmail(
                    req.user.email,
                    req.user.username || req.user.email,
                    item.courseName,
                    item.price,
                    paymentResult.transactionId
                );

                // 🔔 Notifier le professeur d'un nouvel étudiant
                if (course.professor) {
                    const user = req.user;
                    await notifyProfessorNewStudent(
                        course.professor,
                        item.courseName,
                        user.username || user.email,
                        item.courseId.toString()
                    );

                    // 📧 Email au professeur
                    const professor = await require('../models/Users.model').findById(course.professor);
                    if (professor && professor.email) {
                        await sendStudentEnrollmentEmail(
                            professor.email,
                            professor.username || professor.email,
                            user.username || user.email,
                            item.courseName
                        );
                    }
                }

                // 🔔 Notifier le professeur du paiement reçu
                if (course.professor) {
                    await notifyPaymentReceived(
                        course.professor,
                        item.courseName,
                        item.price,
                        item.courseId.toString()
                    );
                }
            }
        }

        // ✅ Marquer le panier comme checkedout
        cart.status = 'checkedout';
        cart.expiresAt = new Date();
        await cart.save();

        // ✅ Réponse de succès
        res.status(200).json({
            success: true,
            msg: "Paiement réussi! Vos cours ont été ajoutés",
            data: {
                transactionId: paymentResult.transactionId,
                amount: cart.totalPrice,
                itemsCount: purchases.length,
                courses: purchases.map(p => ({
                    courseId: p.courseId,
                    purchaseId: p._id,
                    price: p.price
                })),
                receiptUrl: paymentResult.receiptUrl,
                timestamp: paymentResult.timestamp
            }
        });
    }),

    // ✅ Vider le panier
    clearCart: asyncHandler(async (req, res) => {
        const userId = req.user._id || req.user.id;

        const cart = await Cart.findOne({ userId, status: 'active' });
        if (!cart) {
            return sendError(res, 404, "Panier non trouvé", ERROR_TYPES.NOT_FOUND_ERROR);
        }

        await Cart.findByIdAndDelete(cart._id);

        res.status(200).json({
            success: true,
            msg: "Panier vidé"
        });
    }),

    // ✅ Récupérer les anciens paniers (history)
    getCartHistory: asyncHandler(async (req, res) => {
        const userId = req.user._id || req.user.id;
        const { status = 'checkedout' } = req.query;

        const carts = await Cart.find({ userId, status })
            .sort({ createdAt: -1 })
            .limit(20);

        res.status(200).json({
            success: true,
            count: carts.length,
            data: carts
        });
    })
};
