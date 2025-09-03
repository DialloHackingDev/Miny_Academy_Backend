const express = require('express');
const router = express.Router();
const roleCheck = require('../middlewares/roleCheck');
const auth = require("../middlewares/auth.middlewares")
const dashboardController = require('../controllers/Dashboard.controller');
console.log(typeof roleCheck)
const { body, validationResult } = require('express-validator');

// Dashboard étudiant
router.get('/student',auth,roleCheck('eleve'), dashboardController.studentDashboard);

// Dashboard professeur
router.get('/teacher',auth, roleCheck('prof'), dashboardController.teacherDashboard);
// Créer un cours
router.post('/teacher/course',auth, roleCheck('prof'), dashboardController.createCourse);

// Modifier un cours
router.put('/teacher/course/:id',auth, roleCheck('prof'), dashboardController.updateCourse);

// Supprimer un cours
router.delete('/teacher/course/:id',auth, roleCheck('prof'), dashboardController.deleteCourse);

// Dashboard admin
router.get('/admin',auth, roleCheck('admin'), dashboardController.adminDashboard);

// ADMIN : Utilisateurs
router.post(
	'/admin/user',
	auth,
	roleCheck('admin'),
	[
		body('username').notEmpty().withMessage('Le nom d\'utilisateur est obligatoire'),
		body('email').isEmail().withMessage('Email invalide'),
		body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
		body('role').isIn(['admin', 'eleve', 'professeur', 'prof']).withMessage('Rôle invalide')
	],
	(req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		next();
	},
	dashboardController.createUser
);
router.put('/admin/user/:id',auth, roleCheck('admin'), dashboardController.updateUser);
router.patch('/admin/user/:id/disable',auth, roleCheck('admin'), dashboardController.disableUser);
router.delete('/admin/user/:id',auth, roleCheck('admin'), dashboardController.deleteUser);

// ADMIN : Cours
router.put('/admin/course/:id',auth, roleCheck('admin'), dashboardController.updateCourseAdmin);
router.delete('/admin/course/:id',auth, roleCheck('admin'), dashboardController.deleteCourseAdmin);

module.exports = router;
