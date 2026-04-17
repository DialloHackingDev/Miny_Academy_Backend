
//la partie route des cours
const coursControllers = require("../controllers/cours.controller");
const router = require("express").Router();
const { body, param, validationResult } = require('express-validator');
const { authenticateToken, requireTeacher, requireStudent } = require("../middlewares/auth");
const { uploadCourseFiles, cleanupFiles } = require("../middlewares/upload");
const auth = require("../middlewares/auth.middlewares")
const authentification = require("../middlewares/auth")


// 🔹 Créer un cours (professeur ou admin)
router.post(
	"/",
	(req, res, next) => {
		console.log('\n\n=== POST /course - REQUEST RECEIVED ===');
		console.log('Timestamp:', new Date().toISOString());
		console.log('Content-Type:', req.headers['content-type']);
		next();
	},
	authenticateToken,
	requireTeacher,
	(req, res, next) => {
		console.log('=== POST /course - BEFORE MULTER ===');
		uploadCourseFiles(req, res, (err) => {
			if (err) {
				console.error('MULTER ERROR in POST:', err);
				return res.status(400).json({ 
					success: false, 
					message: 'Upload error: ' + err.message 
				});
			}
			console.log('=== POST /course - MULTER SUCCESS ===');
			console.log('Files:', req.files);
			console.log('Body:', req.body);
			next();
		});
	},
	cleanupFiles,
	[
		body('title').notEmpty().withMessage('Le titre est obligatoire'),
		body('description').notEmpty().withMessage('La description est obligatoire'),
		body('courseType').isIn(['text', 'pdf', 'video']).withMessage('Type de cours invalide'),
		body('price').isNumeric().withMessage('Le prix doit être un nombre')
	],
	(req, res, next) => {
		console.log('=== POST /course - VALIDATION ===');
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			console.log('Validation errors:', errors.array());
			return res.status(400).json({ errors: errors.array() });
		}
		next();
	},
	coursControllers.createCourse
)

// 🔹 Inscription à un cours (étudiant)
router.post(
	"/:id/enroll",
	authenticateToken,
	requireStudent,
	[
		param('id').isMongoId().withMessage('ID du cours invalide')
	],
	(req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		next();
	},
	coursControllers.enrollCourse
)

// 🔹 Lister tous les cours
router.get("/",coursControllers.getCourses)



// 🔹 Détail d’un cours
router.get("/:id",coursControllers.getCourseById)



// 🔹 Modifier un cours (professeur ou admin)
router.put(
	"/:id",
	authenticateToken,
	requireTeacher,
	(req, res, next) => {
		console.log('=== BEFORE MULTER ===');
		uploadCourseFiles(req, res, (err) => {
			if (err) {
				console.error('MULTER ERROR:', err);
				return res.status(400).json({ 
					success: false, 
					message: 'Upload error: ' + err.message,
					error: err.toString()
				});
			}
			console.log('=== MULTER SUCCESS ===');
			console.log('Files:', req.files);
			next();
		});
	},
	cleanupFiles,
	coursControllers.updateCourse
)




// 🔹 Supprimer un cours (professeur ou admin)
router.delete(
	"/:id",
	authenticateToken,
	requireTeacher,
	coursControllers.deleteCourse
)
























// 🔹 Télécharger un fichier de cours (étudiant inscrit)
router.get(
	"/:id/download/:fileType",
	authenticateToken,
	requireStudent,
	[
		param('id').isMongoId().withMessage('ID du cours invalide'),
		param('fileType').isIn(['pdf', 'video']).withMessage('Type de fichier invalide')
	],
	(req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		next();
	},
	coursControllers.downloadCourseFile
)

// 🔹 Obtenir les statistiques d'un cours (professeur)
router.get(
	"/:id/stats",
	authenticateToken,
	requireTeacher,
	[
		param('id').isMongoId().withMessage('ID du cours invalide')
	],
	(req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		next();
	},
	coursControllers.getCourseStats
)

module.exports = router;