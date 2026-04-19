/**
 * ✅ Tests pour User.controller
 * Teste: Register, Login, Profile
 */

const userController = require('../controllers/User.controller');
const Users = require('../models/Users.model');
const bcrypt = require('bcryptjs');

describe('User.controller', () => {

    // ✅ TEST: UserRegister
    describe('UserRegister', () => {
        
        it('✅ Doit créer un nouvel utilisateur avec données valides', async () => {
            const req = {
                body: {
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'SecurePass123!',
                    role: 'eleve'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await userController.UserRegister(req, res, null);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    msg: expect.stringContaining('créé')
                })
            );

            // Vérifier en DB
            const user = await Users.findOne({ email: 'test@example.com' });
            expect(user).toBeDefined();
            expect(user.username).toBe('testuser');
            expect(user.role).toBe('eleve');
        });

        it('❌ Doit rejeter email invalide', async () => {
            const req = {
                body: {
                    username: 'testuser',
                    email: 'invalid-email',  // ❌ Pas de @
                    password: 'SecurePass123!'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await userController.UserRegister(req, res, null);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    msg: expect.stringContaining('email')
                })
            );
        });

        it('❌ Doit rejeter password faible', async () => {
            const req = {
                body: {
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'weak'  // ❌ Trop court
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await userController.UserRegister(req, res, null);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    msg: expect.stringContaining('minimum 8')
                })
            );
        });

        it('❌ Doit rejeter email déjà utilisé', async () => {
            // ✅ Créer un utilisateur existant
            await new Users({
                username: 'existinguser',
                email: 'existing@example.com',
                password: await bcrypt.hash('SecurePass123!', 10),
                role: 'eleve'
            }).save();

            const req = {
                body: {
                    username: 'newuser',
                    email: 'existing@example.com',  // ❌ Email déjà utilisé
                    password: 'SecurePass123!'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await userController.UserRegister(req, res, null);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    msg: expect.stringContaining('déjà')
                })
            );
        });

        it('❌ Doit rejeter champs manquants', async () => {
            const req = {
                body: {
                    username: 'testuser'
                    // email et password manquent
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await userController.UserRegister(req, res, null);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('✅ Doit hasher le password correctement', async () => {
            const req = {
                body: {
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'SecurePass123!'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await userController.UserRegister(req, res, null);

            const user = await Users.findOne({ email: 'test@example.com' });
            const isPasswordCorrect = await bcrypt.compare('SecurePass123!', user.password);
            expect(isPasswordCorrect).toBe(true);
        });

        it('✅ Ne doit pas retourner le password', async () => {
            const req = {
                body: {
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'SecurePass123!'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await userController.UserRegister(req, res, null);

            const calls = res.json.mock.calls;
            const responseData = calls[0][0];
            expect(responseData.user.password).toBeUndefined();
        });
    });

    // ✅ TEST: UserLogin
    describe('UserLogin', () => {

        beforeEach(async () => {
            // Créer un utilisateur pour les tests
            const hashedPassword = await bcrypt.hash('SecurePass123!', 10);
            await new Users({
                username: 'testuser',
                email: 'test@example.com',
                password: hashedPassword,
                role: 'eleve'
            }).save();
        });

        it('✅ Doit connecter avec email et password corrects', async () => {
            const req = {
                body: {
                    email: 'test@example.com',
                    password: 'SecurePass123!'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
                cookie: jest.fn().mockReturnThis()
            };

            await userController.UserLogin(req, res, null);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    token: expect.any(String),
                    user: expect.objectContaining({
                        email: 'test@example.com'
                    })
                })
            );
        });

        it('❌ Doit rejeter password incorrect', async () => {
            const req = {
                body: {
                    email: 'test@example.com',
                    password: 'WrongPassword123!'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
                cookie: jest.fn().mockReturnThis()
            };

            await userController.UserLogin(req, res, null);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    msg: expect.stringContaining('incorrect')
                })
            );
        });

        it('❌ Doit rejeter email non-existant', async () => {
            const req = {
                body: {
                    email: 'nonexistent@example.com',
                    password: 'SecurePass123!'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
                cookie: jest.fn().mockReturnThis()
            };

            await userController.UserLogin(req, res, null);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('✅ Doit mettre les cookies de manière sécurisée', async () => {
            const req = {
                body: {
                    email: 'test@example.com',
                    password: 'SecurePass123!'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
                cookie: jest.fn().mockReturnThis()
            };

            await userController.UserLogin(req, res, null);

            expect(res.cookie).toHaveBeenCalled();
            const cookieCall = res.cookie.mock.calls[0];
            expect(cookieCall[0]).toBe('token');
            expect(cookieCall[1]).toBeDefined();
            expect(cookieCall[2]).toMatchObject({
                httpOnly: true,
                sameSite: 'Strict'
            });
        });
    });

    // ✅ TEST: UserProfil
    describe('UserProfil', () => {

        beforeEach(async () => {
            await new Users({
                username: 'testuser',
                email: 'test@example.com',
                password: await bcrypt.hash('SecurePass123!', 10),
                role: 'eleve'
            }).save();
        });

        it('✅ Doit retourner le profil utilisateur', async () => {
            const user = await Users.findOne({ email: 'test@example.com' });

            const req = {
                user: {
                    id: user._id.toString(),
                    _id: user._id
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await userController.UserProfil(req, res, null);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    user: expect.objectContaining({
                        email: 'test@example.com'
                    })
                })
            );
        });

        it('❌ Ne doit pas retourner le password dans le profil', async () => {
            const user = await Users.findOne({ email: 'test@example.com' });

            const req = {
                user: {
                    id: user._id.toString(),
                    _id: user._id
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await userController.UserProfil(req, res, null);

            const calls = res.json.mock.calls;
            const userData = calls[0][0].user;
            expect(userData.password).toBeUndefined();
        });
    });
});
