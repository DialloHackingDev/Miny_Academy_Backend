/**
 * ✅ Tests pour Cart.controller
 * Teste: Panier, ajout/retrait cours, paiement simulé
 */

const cartController = require('../controllers/Cart.controller');
const Cart = require('../models/Cart.model');
const Course = require('../models/Cours.model');
const Purchase = require('../models/Purchase.model');
const Users = require('../models/Users.model');
const mongoose = require('mongoose');

describe('Cart.controller', () => {

    let student, course1, course2;

    beforeEach(async () => {
        // ✅ Créer un étudiant
        student = await new Users({
            username: 'student_cart',
            email: 'student.cart@test.com',
            password: 'hashed',
            role: 'eleve'
        }).save();

        // ✅ Créer 2 cours
        course1 = await new Course({
            title: 'Course 1',
            description: 'First course',
            courseType: 'video',
            content: 'Content 1',
            price: 49.99,
            professor: new mongoose.Types.ObjectId()
        }).save();

        course2 = await new Course({
            title: 'Course 2',
            description: 'Second course',
            courseType: 'text',
            content: 'Content 2',
            price: 29.99,
            professor: new mongoose.Types.ObjectId()
        }).save();
    });

    describe('addToCart', () => {

        it('✅ Doit ajouter un cours au panier', async () => {
            const req = {
                user: { _id: student._id, id: student._id.toString() },
                params: { courseId: course1._id.toString() }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await cartController.addToCart(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: true })
            );

            // Vérifier en DB
            const cart = await Cart.findOne({ userId: student._id, status: 'active' });
            expect(cart).toBeDefined();
            expect(cart.items.length).toBe(1);
            expect(cart.items[0].courseId.toString()).toBe(course1._id.toString());
            expect(cart.totalPrice).toBe(49.99);
        });

        it('✅ Doit calculer totalPrice correctement', async () => {
            // Ajouter 2 cours
            const req1 = {
                user: { _id: student._id, id: student._id.toString() },
                params: { courseId: course1._id.toString() }
            };
            const res1 = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await cartController.addToCart(req1, res1);

            const req2 = {
                user: { _id: student._id, id: student._id.toString() },
                params: { courseId: course2._id.toString() }
            };
            const res2 = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await cartController.addToCart(req2, res2);

            const cart = await Cart.findOne({ userId: student._id, status: 'active' });
            expect(cart.items.length).toBe(2);
            expect(cart.totalPrice).toBe(49.99 + 29.99);
        });

        it('❌ Doit rejeter si cours n\'existe pas', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const req = {
                user: { _id: student._id, id: student._id.toString() },
                params: { courseId: fakeId.toString() }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await cartController.addToCart(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('❌ Doit rejeter si déjà acheté', async () => {
            // Acheter d'abord
            await new Purchase({
                userId: student._id,
                courseId: course1._id,
                paymentStatus: 'paid',
                price: 49.99,
                date: new Date()
            }).save();

            const req = {
                user: { _id: student._id, id: student._id.toString() },
                params: { courseId: course1._id.toString() }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await cartController.addToCart(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
        });

        it('❌ Doit rejeter doublons dans le panier', async () => {
            const req = {
                user: { _id: student._id, id: student._id.toString() },
                params: { courseId: course1._id.toString() }
            };
            const res1 = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const res2 = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            // Ajouter 2 fois
            await cartController.addToCart(req, res1);
            await cartController.addToCart(req, res2);

            expect(res2.status).toHaveBeenCalledWith(409);
        });
    });

    describe('removeFromCart', () => {

        it('✅ Doit retirer un cours du panier', async () => {
            // Ajouter d'abord
            const addReq = {
                user: { _id: student._id, id: student._id.toString() },
                params: { courseId: course1._id.toString() }
            };
            const addRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await cartController.addToCart(addReq, addRes);

            // Retirer
            const removeReq = {
                user: { _id: student._id, id: student._id.toString() },
                params: { courseId: course1._id.toString() }
            };
            const removeRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await cartController.removeFromCart(removeReq, removeRes);

            expect(removeRes.status).toHaveBeenCalledWith(200);

            // Vérifier que le panier est vide/supprimé
            const cart = await Cart.findOne({ userId: student._id, status: 'active' });
            expect(cart).toBeNull();
        });
    });

    describe('getCart', () => {

        it('✅ Doit retourner le panier avec les cours', async () => {
            // Ajouter 2 cours
            const addReq1 = {
                user: { _id: student._id, id: student._id.toString() },
                params: { courseId: course1._id.toString() }
            };
            const addRes1 = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await cartController.addToCart(addReq1, addRes1);

            // Récupérer le panier
            const getReq = {
                user: { _id: student._id, id: student._id.toString() },
                query: {}
            };
            const getRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await cartController.getCart(getReq, getRes);

            expect(getRes.status).toHaveBeenCalledWith(200);
            const response = getRes.json.mock.calls[0][0];
            expect(response.data.items.length).toBe(1);
            expect(response.data.totalPrice).toBe(49.99);
        });

        it('✅ Doit retourner panier vide si aucun cours', async () => {
            const req = {
                user: { _id: student._id, id: student._id.toString() },
                query: {}
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await cartController.getCart(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            const response = res.json.mock.calls[0][0];
            expect(response.data.items.length).toBe(0);
            expect(response.data.totalPrice).toBe(0);
        });
    });

    describe('checkout', () => {

        it('✅ Doit effectuer un paiement réussi', async () => {
            // Ajouter un cours
            const addReq = {
                user: { _id: student._id, id: student._id.toString() },
                params: { courseId: course1._id.toString() }
            };
            const addRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await cartController.addToCart(addReq, addRes);

            // Checkout
            const checkoutReq = {
                user: { _id: student._id, id: student._id.toString() },
                body: { paymentMethod: 'simulated_card' }
            };
            const checkoutRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await cartController.checkout(checkoutReq, checkoutRes);

            expect(checkoutRes.status).toHaveBeenCalledWith(200);
            const response = checkoutRes.json.mock.calls[0][0];
            expect(response.success).toBe(true);
            expect(response.data.transactionId).toBeDefined();
            expect(response.data.itemsCount).toBe(1);

            // Vérifier purchase créée
            const purchase = await Purchase.findOne({
                userId: student._id,
                courseId: course1._id
            });
            expect(purchase).toBeDefined();
            expect(purchase.paymentStatus).toBe('paid');
            expect(purchase.transactionId).toBeDefined();
        });

        it('❌ Doit rejeter checkout avec panier vide', async () => {
            const req = {
                user: { _id: student._id, id: student._id.toString() },
                body: { paymentMethod: 'simulated_card' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await cartController.checkout(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('✅ Doit créer purchase et ajouter student au cours', async () => {
            // Ajouter
            const addReq = {
                user: { _id: student._id, id: student._id.toString() },
                params: { courseId: course1._id.toString() }
            };
            const addRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await cartController.addToCart(addReq, addRes);

            // Checkout
            const checkoutReq = {
                user: { _id: student._id, id: student._id.toString() },
                body: { paymentMethod: 'simulated_card' }
            };
            const checkoutRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await cartController.checkout(checkoutReq, checkoutRes);

            // Vérifier course.students
            const updatedCourse = await Course.findById(course1._id);
            expect(updatedCourse.students).toContainEqual(student._id);
        });

        it('✅ Doit marquer panier comme "checkedout"', async () => {
            // Ajouter
            const addReq = {
                user: { _id: student._id, id: student._id.toString() },
                params: { courseId: course1._id.toString() }
            };
            const addRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await cartController.addToCart(addReq, addRes);

            // Checkout
            const checkoutReq = {
                user: { _id: student._id, id: student._id.toString() },
                body: { paymentMethod: 'simulated_card' }
            };
            const checkoutRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await cartController.checkout(checkoutReq, checkoutRes);

            // Vérifier status
            const cart = await Cart.findOne({ userId: student._id });
            expect(cart.status).toBe('checkedout');
        });
    });

    describe('clearCart', () => {

        it('✅ Doit vider le panier', async () => {
            // Ajouter d'abord
            const addReq = {
                user: { _id: student._id, id: student._id.toString() },
                params: { courseId: course1._id.toString() }
            };
            const addRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await cartController.addToCart(addReq, addRes);

            // Vider
            const clearReq = {
                user: { _id: student._id, id: student._id.toString() }
            };
            const clearRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await cartController.clearCart(clearReq, clearRes);

            expect(clearRes.status).toHaveBeenCalledWith(200);

            // Vérifier qu'il n'y a plus de panier
            const cart = await Cart.findOne({ userId: student._id, status: 'active' });
            expect(cart).toBeNull();
        });
    });
});
