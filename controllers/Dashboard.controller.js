

// Contrôleur des dashboards


    // Dashboard étudiant
   exports.studentDashboard = async (req, res) => {
            const userId = req.user._id;
            console.log(userId)
            const Course = require('../models/Cours.model');
            try {
                // Récupérer les cours où l'étudiant est inscrit
                const courses = await Course.find({ students: userId })
                    .select('title description content price professor')
                    .populate('professor', 'username email');

                // Simuler la progression (exemple : 0 à 100%)
                const progress = courses.map(course => ({
                    courseId: course._id,
                    title: course.title,
                    progression: Math.floor(Math.random() * 101) // à remplacer par vraie progression
                }));

                res.json({
                    courses,
                    progress
                });
            } catch (err) {
                res.status(500).json({ message: 'Erreur dashboard étudiant', error: err.message });
            }
    },

    // Dashboard professeur
    exports.teacherDashboard = async (req, res) => {
            const teacherId = req.user._id;
            const Course = require('../models/Cours.model');
            const User = require('../models/Users.model');
            try {
                // Récupérer les cours créés par le professeur
                const courses = await Course.find({ professor: teacherId })
                    .select('title description content price students');

                // Pour chaque cours, récupérer les étudiants inscrits
                const coursesWithStudents = await Promise.all(courses.map(async course => {
                    const students = await User.find({ _id: { $in: course.students } }).select('username email');
                    return {
                        ...course._doc,
                        students
                    };
                }));

                res.json({
                    courses: coursesWithStudents
                });
            } catch (err) {
                res.status(500).json({ message: 'Erreur dashboard professeur', error: err.message });
            }
    },

    // Dashboard admin
        exports.adminDashboard = async (req, res) => {
            const User = require('../models/Users.model');
            const Course = require('../models/Cours.model');
            try {
                const users = await User.find().select('username email role');
                const courses = await Course.find()
                    .select('title description content price professor students')
                    .populate('professor', 'username email')
                    .populate('students', 'username email');
                res.json({
                    users,
                    courses
                });
            } catch (err) {
                res.status(500).json({ message: 'Erreur dashboard admin', error: err.message });
            }
        },

        // Créer un cours (professeur)
        exports.createCourse = async (req, res) => {
            const Course = require('../models/Cours.model');
            try {
                const { title, description, content, price } = req.body;
                const newCourse = new Course({
                    title,
                    description,
                    content,
                    price,
                    professor: req.user._id,
                    students: []
                });
                await newCourse.save();
                res.status(201).json({ message: 'Cours créé', course: newCourse });
            } catch (err) {
                res.status(500).json({ message: 'Erreur création cours', error: err.message });
            }
        },

        // Modifier un cours (professeur)
        exports.updateCourse = async (req, res) => {
            const Course = require('../models/Cours.model');
            try {
                const courseId = req.params.id;
                const course = await Course.findById(courseId);
                if (!course) return res.status(404).json({ message: 'Cours non trouvé' });
                if (String(course.professor) !== String(req.user._id)) {
                    return res.status(403).json({ message: 'Accès interdit : vous n\'êtes pas l\'auteur de ce cours' });
                }
                const { title, description, content, price } = req.body;
                course.title = title || course.title;
                course.description = description || course.description;
                course.content = content || course.content;
                course.price = price !== undefined ? price : course.price;
                await course.save();
                res.json({ message: 'Cours modifié', course });
            } catch (err) {
                res.status(500).json({ message: 'Erreur modification cours', error: err.message });
            }
        },

        // Supprimer un cours (professeur)
        exports.deleteCourse = async (req, res) => {
            const Course = require('../models/Cours.model');
            try {
                const courseId = req.params.id;
                const course = await Course.findById(courseId);
                if (!course) return res.status(404).json({ message: 'Cours non trouvé' });
                if (String(course.professor) !== String(req.user._id)) {
                    return res.status(403).json({ message: 'Accès interdit : vous n\'êtes pas l\'auteur de ce cours' });
                }
                await course.deleteOne();
                res.json({ message: 'Cours supprimé' });
            } catch (err) {
                res.status(500).json({ message: 'Erreur suppression cours', error: err.message });
            }
        }
    ,
            // ADMIN : Ajouter un utilisateur
            exports.createUser = async (req, res) => {
                const User = require('../models/Users.model');
                try {
                    const { username, email, password, role } = req.body;
                    const newUser = new User({ username, email, password, role });
                    await newUser.save();
                    res.status(201).json({ message: 'Utilisateur créé', user: newUser });
                } catch (err) {
                    res.status(500).json({ message: 'Erreur création utilisateur', error: err.message });
                }
            },

            // ADMIN : Modifier un utilisateur
            exports.updateUser = async (req, res) => {
                const User = require('../models/Users.model');
                try {
                    const userId = req.params.id;
                    const user = await User.findById(userId);
                    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
                    const { username, email, role } = req.body;
                    user.username = username || user.username;
                    user.email = email || user.email;
                    user.role = role || user.role;
                    await user.save();
                    res.json({ message: 'Utilisateur modifié', user });
                } catch (err) {
                    res.status(500).json({ message: 'Erreur modification utilisateur', error: err.message });
                }
            },

            // ADMIN : Désactiver un utilisateur
            exports.disableUser = async (req, res) => {
                const User = require('../models/Users.model');
                try {
                    const userId = req.params.id;
                    const user = await User.findById(userId);
                    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
                    user.disabled = true;
                    await user.save();
                    res.json({ message: 'Utilisateur désactivé', user });
                } catch (err) {
                    res.status(500).json({ message: 'Erreur désactivation utilisateur', error: err.message });
                }
            },

            // ADMIN : Supprimer un utilisateur
            exports.deleteUser = async (req, res) => {
                const User = require('../models/Users.model');
                try {
                    const userId = req.params.id;
                    const user = await User.findById(userId);
                    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
                    await user.deleteOne();
                    res.json({ message: 'Utilisateur supprimé' });
                } catch (err) {
                    res.status(500).json({ message: 'Erreur suppression utilisateur', error: err.message });
                }
            },

            // ADMIN : Modifier un cours
            exports.updateCourseAdmin = async (req, res) => {
                const Course = require('../models/Cours.model');
                try {
                    const courseId = req.params.id;
                    const course = await Course.findById(courseId);
                    if (!course) return res.status(404).json({ message: 'Cours non trouvé' });
                    const { title, description, content, price, professor } = req.body;
                    course.title = title || course.title;
                    course.description = description || course.description;
                    course.content = content || course.content;
                    course.price = price !== undefined ? price : course.price;
                    course.professor = professor || course.professor;
                    await course.save();
                    res.json({ message: 'Cours modifié (admin)', course });
                } catch (err) {
                    res.status(500).json({ message: 'Erreur modification cours', error: err.message });
                }
            },

            // ADMIN : Supprimer un cours
            exports.deleteCourseAdmin = async (req, res) => {
                const Course = require('../models/Cours.model');
                try {
                    const courseId = req.params.id;
                    const course = await Course.findById(courseId);
                    if (!course) return res.status(404).json({ message: 'Cours non trouvé' });
                    await course.deleteOne();
                    res.json({ message: 'Cours supprimé (admin)' });
                } catch (err) {
                    res.status(500).json({ message: 'Erreur suppression cours', error: err.message });
                }
            }

