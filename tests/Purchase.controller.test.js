/**
 * ✅ Tests pour Purchase.controller
 * Teste: Achat cours, vérifier achat, historique
 */

const purchaseController = require('../controllers/Purchase.controller');
const Purchase = require('../models/Purchase.model');
const Course = require('../models/Cours.model');
const Users = require('../models/Users.model');
const mongoose = require('mongoose');

describe('Purchase.controller', () => {

    let student, professor, course;

    beforeEach(async () => {
        // ✅ Créer un professeur
        professor = await new Users({
            username: 'professor',
            email: 'prof@example.com',
            password: 'hashed',
            role: 'prof'
        }).save();

        // ✅ Créer un étudiant
        student = await new Users({
            username: 'student1',
            email: 'student@example.com',
            password: 'hashed',
            role: 'eleve'
        }).save();

        // ✅ Créer un cours
        course = await new Course({
            title: 'Paid Course',
            description: 'A course',
            courseType: 'text',
            content: 'Course content',
            professor: professor._id,
            price: 99.99
        }).save();
    });

    describe('buyCourse', () => {

        it('✅ Doit acheter un cours avec succès', async () => {
            const req = {
                user: { _id: student._id, id: student._id.toString() },
                params: { courseId: course._id.toString() }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await purchaseController.buyCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true
                })
            );

            // Vérifier en DB
            const purchase = await Purchase.findOne({
                userId: student._id,
                courseId: course._id
            });
            expect(purchase).toBeDefined();
            expect(purchase.paymentStatus).toBe('paid');
        });

        it('✅ Doit sauvegarder le prix au moment de l\'achat', async () => {
            const req = {
                user: { _id: student._id, id: student._id.toString() },
                params: { courseId: course._id.toString() }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await purchaseController.buyCourse(req, res);

            const purchase = await Purchase.findOne({
                userId: student._id,
                courseId: course._id
            });
            expect(purchase.price).toBe(99.99);
            expect(purchase.date).toBeDefined();
        });

        it('❌ Doit rejeter achat dupliqué', async () => {
            // Premier achat
            const req1 = {
                user: { _id: student._id, id: student._id.toString() },
                params: { courseId: course._id.toString() }
            };
            const res1 = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await purchaseController.buyCourse(req1, res1);

            // Deuxième achat (devrait échouer)
            const req2 = {
                user: { _id: student._id, id: student._id.toString() },
                params: { courseId: course._id.toString() }
            };
            const res2 = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await purchaseController.buyCourse(req2, res2);

            expect(res2.status).toHaveBeenCalledWith(409);  // ✅ Conflict pour duplicate
        });

        it('❌ Doit rejeter si cours inexistant', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const req = {
                user: { _id: student._id, id: student._id.toString() },
                params: { courseId: fakeId.toString() }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await purchaseController.buyCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('❌ Doit rejeter ID cours invalide', async () => {
            const req = {
                user: { _id: student._id, id: student._id.toString() },
                params: { courseId: 'invalid-id' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await purchaseController.buyCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('getMyCourses', () => {

        it('✅ Doit retourner mes cours achetés', async () => {
            // Acheter un cours
            const req1 = {
                user: { _id: student._id, id: student._id.toString() },
                params: { courseId: course._id.toString() }
            };
            const res1 = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await purchaseController.buyCourse(req1, res1);

            // Récupérer mes cours
            const req2 = {
                user: { _id: student._id, id: student._id.toString() },
                query: { page: '1' }
            };
            const res2 = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await purchaseController.getMyCourses(req2, res2);

            expect(res2.status).toHaveBeenCalledWith(200);
            const data = res2.json.mock.calls[0][0].data;
            expect(data.length).toBe(1);
            expect(data[0].courseId.toString()).toBe(course._id.toString());
        });

        it('✅ Doit retourner liste vide si aucun achat', async () => {
            const req = {
                user: { _id: student._id, id: student._id.toString() },
                query: { page: '1' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await purchaseController.getMyCourses(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            const data = res.json.mock.calls[0][0].data;
            expect(data).toBeDefined();
            expect(data.length).toBe(0);
        });
    });

    describe('hasUserPurchased', () => {

        it('✅ Doit retourner true si acheté', async () => {
            // Acheter
            const req1 = {
                user: { _id: student._id, id: student._id.toString() },
                params: { courseId: course._id.toString() }
            };
            const res1 = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await purchaseController.buyCourse(req1, res1);

            // Vérifier
            const req2 = {
                user: { _id: student._id, id: student._id.toString() },
                params: { courseId: course._id.toString() }
            };
            const res2 = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await purchaseController.hasUserPurchased(req2, res2);

            expect(res2.status).toHaveBeenCalledWith(200);
            const response = res2.json.mock.calls[0][0];
            expect(response.purchased).toBe(true);
        });

        it('❌ Doit retourner false si non acheté', async () => {
            const req = {
                user: { _id: student._id, id: student._id.toString() },
                params: { courseId: course._id.toString() }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await purchaseController.hasUserPurchased(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            const response = res.json.mock.calls[0][0];
            expect(response.purchased).toBe(false);
        });
    });
});
