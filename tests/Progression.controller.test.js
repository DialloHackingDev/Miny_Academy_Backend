/**
 * ✅ Tests pour Progression.controller
 * Teste: Calcul progression correct, marking lessons, etc.
 */

const progressionController = require('../controllers/Progression.controller');
const Progression = require('../models/Progression.model');
const Course = require('../models/Cours.model');
const Users = require('../models/Users.model');
const mongoose = require('mongoose');

describe('Progression.controller', () => {

    let user, course;

    beforeEach(async () => {
        // ✅ Créer un utilisateur
        user = await new Users({
            username: 'testuser',
            email: 'test@example.com',
            password: 'hashed',
            role: 'eleve'
        }).save();

        // ✅ Créer un cours avec modules et leçons
        course = await new Course({
            title: 'Test Course',
            description: 'Test Course Description',
            courseType: 'text',
            content: 'Test content',
            professor: user._id,
            students: [user._id],
            modules: [
                {
                    title: 'Module 1',
                    description: 'First module',
                    lessons: [
                        {
                            title: 'Lesson 1.1',
                            type: 'video',
                            duration: 10,
                            isFree: false
                        },
                        {
                            title: 'Lesson 1.2',
                            type: 'text',
                            duration: 5,
                            isFree: false
                        }
                    ]
                },
                {
                    title: 'Module 2',
                    description: 'Second module',
                    lessons: [
                        {
                            title: 'Lesson 2.1',
                            type: 'pdf',
                            duration: 15,
                            isFree: false
                        }
                    ]
                }
            ]
        }).save();
    });

    describe('markLessonCompleted', () => {

        it('✅ Doit marquer une leçon comme complétée', async () => {
            const lessonId = course.modules[0].lessons[0]._id.toString();

            const req = {
                user: { _id: user._id, id: user._id.toString() },
                params: {
                    courseId: course._id.toString(),
                    lessonId
                },
                body: { timeSpent: 600 }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await progressionController.markLessonCompleted(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true
                })
            );

            // Vérifier en DB
            const progression = await Progression.findOne({
                userId: user._id,
                courseId: course._id
            });
            expect(progression).toBeDefined();
            expect(progression.completedLessons.length).toBe(1);
            expect(progression.completedLessons[0].lessonId.toString()).toBe(lessonId);
        });

        it('✅ Doit calculer correctement le pourcentage (1/3 = 33%)', async () => {
            const lessonId = course.modules[0].lessons[0]._id.toString();

            const req = {
                user: { _id: user._id, id: user._id.toString() },
                params: {
                    courseId: course._id.toString(),
                    lessonId
                },
                body: { timeSpent: 0 }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await progressionController.markLessonCompleted(req, res);

            const progression = await Progression.findOne({
                userId: user._id,
                courseId: course._id
            });
            // 1 leçon sur 3 = 33%
            expect(progression.progressPercentage).toBe(33);
            expect(progression.totalLessons).toBe(3);
        });

        it('✅ Doit marquer comme "completed" quand 100%', async () => {
            const lesson1 = course.modules[0].lessons[0]._id.toString();
            const lesson2 = course.modules[0].lessons[1]._id.toString();
            const lesson3 = course.modules[1].lessons[0]._id.toString();

            // Marquer les 3 leçons complétées
            for (const lessonId of [lesson1, lesson2, lesson3]) {
                const req = {
                    user: { _id: user._id, id: user._id.toString() },
                    params: {
                        courseId: course._id.toString(),
                        lessonId
                    },
                    body: { timeSpent: 0 }
                };
                const res = {
                    status: jest.fn().mockReturnThis(),
                    json: jest.fn()
                };
                await progressionController.markLessonCompleted(req, res);
            }

            const progression = await Progression.findOne({
                userId: user._id,
                courseId: course._id
            });
            expect(progression.progressPercentage).toBe(100);
            expect(progression.status).toBe('completed');
            expect(progression.certificateEarned).toBe(true);
        });

        it('✅ Doit ne pas dupliquer leçons déjà complétées', async () => {
            const lessonId = course.modules[0].lessons[0]._id.toString();

            const req = {
                user: { _id: user._id, id: user._id.toString() },
                params: {
                    courseId: course._id.toString(),
                    lessonId
                },
                body: { timeSpent: 600 }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            // Marquer 2 fois
            await progressionController.markLessonCompleted(req, res);
            await progressionController.markLessonCompleted(req, res);

            const progression = await Progression.findOne({
                userId: user._id,
                courseId: course._id
            });
            // Doit rester 1, pas 2
            expect(progression.completedLessons.length).toBe(1);
            expect(progression.progressPercentage).toBe(33);
        });

        it('❌ Doit rejeter si l\'utilisateur n\'est pas inscrit', async () => {
            const otherUser = await new Users({
                username: 'otheruser',
                email: 'other@example.com',
                password: 'hashed',
                role: 'eleve'
            }).save();

            const lessonId = course.modules[0].lessons[0]._id.toString();

            const req = {
                user: { _id: otherUser._id, id: otherUser._id.toString() },
                params: {
                    courseId: course._id.toString(),
                    lessonId
                },
                body: { timeSpent: 0 }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await progressionController.markLessonCompleted(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('❌ Doit rejeter leçon inexistante', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const req = {
                user: { _id: user._id, id: user._id.toString() },
                params: {
                    courseId: course._id.toString(),
                    lessonId: fakeId.toString()
                },
                body: { timeSpent: 0 }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await progressionController.markLessonCompleted(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('getProgression', () => {

        it('✅ Doit retourner progression avec structure modules', async () => {
            // Marquer une leçon
            const lessonId = course.modules[0].lessons[0]._id.toString();
            const req1 = {
                user: { _id: user._id, id: user._id.toString() },
                params: {
                    courseId: course._id.toString(),
                    lessonId
                },
                body: { timeSpent: 0 }
            };
            const res1 = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await progressionController.markLessonCompleted(req1, res1);

            // Récupérer progression
            const req2 = {
                user: { _id: user._id, id: user._id.toString() },
                params: {
                    courseId: course._id.toString()
                }
            };
            const res2 = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await progressionController.getProgression(req2, res2);

            expect(res2.status).toHaveBeenCalledWith(200);
            const data = res2.json.mock.calls[0][0].data;
            expect(data.modules).toBeDefined();
            expect(data.modules.length).toBe(2);
            expect(data.modules[0].lessons).toBeDefined();
        });

        it('✅ Doit marquer les leçons comme complétées correctement', async () => {
            const lessonId = course.modules[0].lessons[0]._id.toString();
            const req1 = {
                user: { _id: user._id, id: user._id.toString() },
                params: {
                    courseId: course._id.toString(),
                    lessonId
                },
                body: { timeSpent: 0 }
            };
            const res1 = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            await progressionController.markLessonCompleted(req1, res1);

            const req2 = {
                user: { _id: user._id, id: user._id.toString() },
                params: {
                    courseId: course._id.toString()
                }
            };
            const res2 = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await progressionController.getProgression(req2, res2);

            const data = res2.json.mock.calls[0][0].data;
            const lesson = data.modules[0].lessons[0];
            expect(lesson.isCompleted).toBe(true);
            expect(lesson.completedAt).toBeDefined();
        });
    });
});
