/**
 * ✅ Tests pour Notification.controller
 * Teste: Créer, récupérer, marquer lu, supprimer notifications
 */

const notificationController = require('../controllers/Notification.controller');
const Notification = require('../models/Notification.model');
const Users = require('../models/Users.model');
const mongoose = require('mongoose');

describe('Notification.controller', () => {

    let admin, user;

    beforeEach(async () => {
        // ✅ Créer un admin
        admin = await new Users({
            username: 'admin',
            email: 'admin@example.com',
            password: 'hashed',
            role: 'admin'
        }).save();

        // ✅ Créer un utilisateur
        user = await new Users({
            username: 'user1',
            email: 'user@example.com',
            password: 'hashed',
            role: 'eleve'
        }).save();
    });

    describe('createNotification', () => {

        it('✅ Doit créer une notification pour l\'utilisateur', async () => {
            const req = {
                user: { _id: admin._id, role: 'admin' },
                params: { userId: user._id.toString() },
                body: {
                    message: 'New course available',
                    type: 'course'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await notificationController.createNotification(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true
                })
            );

            // Vérifier en DB
            const notification = await Notification.findOne({
                userId: user._id
            });
            expect(notification).toBeDefined();
            expect(notification.message).toBe('New course available');
            expect(notification.type).toBe('course');
            expect(notification.isRead).toBe(false);
        });

        it('❌ Doit rejeter message vide', async () => {
            const req = {
                user: { _id: admin._id, role: 'admin' },
                params: { userId: user._id.toString() },
                body: {
                    message: '',
                    type: 'course'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await notificationController.createNotification(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('❌ Doit rejeter type invalide', async () => {
            const req = {
                user: { _id: admin._id, role: 'admin' },
                params: { userId: user._id.toString() },
                body: {
                    message: 'Message',
                    type: 'invalid_type'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await notificationController.createNotification(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('getMyNotifications', () => {

        it('✅ Doit retourner mes notifications', async () => {
            // Créer notification
            await new Notification({
                userId: user._id,
                message: 'Test message',
                type: 'system'
            }).save();

            const req = {
                user: { _id: user._id, id: user._id.toString() },
                query: { page: '1' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await notificationController.getMyNotifications(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            const response = res.json.mock.calls[0][0];
            expect(response.notifications).toBeDefined();
            expect(response.notifications.length).toBe(1);
            expect(response.notifications[0].message).toBe('Test message');
        });

        it('✅ Doit retourner uniquement notifications non lues si demandé', async () => {
            // Créer 2 notifications
            const notif1 = await new Notification({
                userId: user._id,
                message: 'Unread notification message',
                type: 'system',
                isRead: false
            }).save();
            const notif2 = await new Notification({
                userId: user._id,
                message: 'Read notification message',
                type: 'system',
                isRead: true
            }).save();

            const req = {
                user: { _id: user._id, id: user._id.toString() },
                query: { page: '1', unreadOnly: 'true' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await notificationController.getMyNotifications(req, res);

            const response = res.json.mock.calls[0][0];
            expect(response.notifications.length).toBe(1);
            expect(response.notifications[0].message).toContain('Unread');
        });

        it('✅ Doit compter les non lues', async () => {
            await new Notification({
                userId: user._id,
                message: 'Unread notification 1',
                type: 'system',
                isRead: false
            }).save();
            await new Notification({
                userId: user._id,
                message: 'Unread notification 2',
                type: 'system',
                isRead: false
            }).save();
            await new Notification({
                userId: user._id,
                message: 'Read notification message',
                type: 'system',
                isRead: true
            }).save();

            const req = {
                user: { _id: user._id, id: user._id.toString() },
                query: { page: '1' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await notificationController.getMyNotifications(req, res);

            const response = res.json.mock.calls[0][0];
            expect(response.unreadCount).toBe(2);
        });
    });

    describe('markAsRead', () => {

        it('✅ Doit marquer une notification comme lue', async () => {
            const notification = await new Notification({
                userId: user._id,
                message: 'Test notification message',
                type: 'system',
                isRead: false
            }).save();

            const req = {
                user: { _id: user._id, id: user._id.toString() },
                params: { id: notification._id.toString() }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await notificationController.markAsRead(req, res);

            expect(res.status).toHaveBeenCalledWith(200);

            const updated = await Notification.findById(notification._id);
            expect(updated.isRead).toBe(true);
        });

        it('❌ Doit rejeter si notification inexistante', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const req = {
                user: { _id: user._id, id: user._id.toString() },
                params: { id: fakeId.toString() }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await notificationController.markAsRead(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('markAllAsRead', () => {

        it('✅ Doit marquer toutes les notifications comme lues', async () => {
            await new Notification({
                userId: user._id,
                message: 'Test 1',
                type: 'system',
                isRead: false
            }).save();
            await new Notification({
                userId: user._id,
                message: 'Test 2',
                type: 'system',
                isRead: false
            }).save();

            const req = {
                user: { _id: user._id, id: user._id.toString() }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await notificationController.markAllAsRead(req, res);

            expect(res.status).toHaveBeenCalledWith(200);

            const notifs = await Notification.find({ userId: user._id });
            notifs.forEach(n => {
                expect(n.isRead).toBe(true);
            });
        });
    });

    describe('deleteNotification', () => {

        it('✅ Doit supprimer une notification', async () => {
            const notification = await new Notification({
                userId: user._id,
                message: 'Delete me',
                type: 'system'
            }).save();

            const req = {
                user: { _id: user._id, id: user._id.toString() },
                params: { id: notification._id.toString() }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await notificationController.deleteNotification(req, res);

            expect(res.status).toHaveBeenCalledWith(200);

            const deleted = await Notification.findById(notification._id);
            expect(deleted).toBeNull();
        });
    });

    describe('deleteAllNotifications', () => {

        it('✅ Doit supprimer toutes les notifications', async () => {
            await new Notification({
                userId: user._id,
                message: 'Delete 1',
                type: 'system'
            }).save();
            await new Notification({
                userId: user._id,
                message: 'Delete 2',
                type: 'system'
            }).save();

            const req = {
                user: { _id: user._id, id: user._id.toString() }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await notificationController.deleteAllNotifications(req, res);

            expect(res.status).toHaveBeenCalledWith(200);

            const notifs = await Notification.find({ userId: user._id });
            expect(notifs.length).toBe(0);
        });
    });
});
