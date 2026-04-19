

// Contrôleur des dashboards


    // Dashboard étudiant
   exports.studentDashboard = async (req, res) => {
            const userId = req.user._id;
            console.log("verification de l'utilisateur:",userId)
            const Course = require('../models/Cours.model');
            const Progression = require('../models/Progression.model');
            try {
                // Récupérer les cours où l'étudiant est inscrit
                const courses = await Course.find({ students: userId })
                    .select('title description content price professor coverImage courseType category')
                    .populate('professor', 'username email');

                // Récupérer la progression réelle pour chaque cours
                const progressions = await Progression.find({ userId, courseId: { $in: courses.map(c => c._id) } });

                const progress = courses.map(course => {
                    const prog = progressions.find(p => String(p.courseId) === String(course._id));
                    return {
                        courseId: course._id,
                        title: course.title,
                        progression: prog ? prog.progressPercentage : 0,
                        certificateEarned: prog ? prog.certificateEarned : false,
                        status: prog ? prog.status : 'not-started',
                        lastAccessedAt: prog ? prog.lastAccessedAt : null
                    };
                });

                res.json({
                    courses,
                    progress
                });
            } catch (err) {
                res.status(500).json({ message: 'Erreur dashboard étudiant', error: err.message });
            }
    }

    // Analytics étudiant
    exports.getStudentAnalytics = async (req, res) => {
        const userId = req.user._id;
        const Course = require('../models/Cours.model');
        const Progression = require('../models/Progression.model');
        try {
            // Récupérer tous les cours de l'étudiant
            const courses = await Course.find({ students: userId })
                .select('title price category coverImage stats');

            // Récupérer les progressions de l'étudiant
            const progressions = await Progression.find({ userId, courseId: { $in: courses.map(c => c._id) } });

            // Calculer les statistiques globales
            const totalCourses = courses.length;
            const totalSpent = courses.reduce((acc, course) => acc + (course.price || 0), 0);
            
            // Calculer la progression moyenne (0 si aucun cours)
            const totalProgress = progressions.reduce((acc, p) => acc + (p.progressPercentage || 0), 0);
            const avgProgress = totalCourses > 0 ? Math.round(totalProgress / totalCourses) : 0;
            
            // Temps total d'apprentissage (en secondes, converti en minutes/heures côté front)
            const totalTimeSpentSeconds = progressions.reduce((acc, p) => acc + (p.totalTimeSpent || 0), 0);
            
            // Nombre de certificats obtenus
            const certificatesCount = progressions.filter(p => p.certificateEarned).length;

            // Répartition par catégorie pour le graphique circulaire
            const categoriesCount = {};
            courses.forEach(c => {
                const cat = c.category || 'Général';
                categoriesCount[cat] = (categoriesCount[cat] || 0) + 1;
            });
            const categoryDistribution = Object.keys(categoriesCount).map(key => ({
                name: key,
                value: categoriesCount[key]
            }));

            res.json({
                success: true,
                totalCourses,
                totalSpent,
                avgProgress,
                certificatesCount,
                totalTimeSpentSeconds,
                categoryDistribution,
                courses: courses.map(c => {
                    const prog = progressions.find(p => String(p.courseId) === String(c._id));
                    return {
                        _id: c._id,
                        title: c.title,
                        price: c.price,
                        category: c.category || 'Général',
                        progress: prog ? prog.progressPercentage : 0,
                        timeSpent: prog ? prog.totalTimeSpent : 0,
                        lastAccessed: prog ? prog.lastAccessedAt : null
                    };
                })
            });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Erreur analytics étudiant', error: err.message });
        }
    }

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
    }

    // Dashboard admin
        exports.adminDashboard = async (req, res) => {
            const User = require('../models/Users.model');
            const Course = require('../models/Cours.model');
            const Purchase = require('../models/Purchase.model');
            const Progression = require('../models/Progression.model');
            try {
                const users = await User.find().select('username email role createdAt disabled');
                const courses = await Course.find()
                    .select('title description price professor students category courseType createdAt coverImage')
                    .populate('professor', 'username email');

                // Revenue & purchase stats
                const purchases = await Purchase.find({ paymentStatus: 'paid' })
                    .populate('userId', 'username email')
                    .populate('courseId', 'title price')
                    .sort({ createdAt: -1 })
                    .limit(20);
                
                const totalRevenue = purchases.reduce((sum, p) => sum + (p.price || 0), 0);

                // Certificates earned
                const progressions = await Progression.find({ certificateEarned: true });
                const totalCertificates = progressions.length;

                // Counts
                const totalStudents = users.filter(u => u.role === 'eleve').length;
                const totalProfessors = users.filter(u => u.role === 'prof').length;
                const totalCourses = courses.length;

                // Monthly revenue (last 6 months)
                const now = new Date();
                const monthlyRevenue = [];
                for (let i = 5; i >= 0; i--) {
                    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
                    const rev = purchases
                        .filter(p => p.createdAt >= start && p.createdAt <= end)
                        .reduce((sum, p) => sum + (p.price || 0), 0);
                    monthlyRevenue.push({ 
                        month: start.toLocaleDateString('fr-FR', { month: 'short' }), 
                        revenue: rev 
                    });
                }

                // Top courses by students
                const topCourses = [...courses]
                    .sort((a, b) => (b.students?.length || 0) - (a.students?.length || 0))
                    .slice(0, 5)
                    .map(c => ({ _id: c._id, title: c.title, students: c.students?.length || 0, revenue: (c.price || 0) * (c.students?.length || 0) }));

                res.json({
                    users,
                    courses,
                    purchases: purchases.slice(0, 10),
                    stats: {
                        totalUsers: users.length,
                        totalStudents,
                        totalProfessors,
                        totalCourses,
                        totalRevenue,
                        totalCertificates,
                    },
                    monthlyRevenue,
                    topCourses
                });
            } catch (err) {
                res.status(500).json({ message: 'Erreur dashboard admin', error: err.message });
            }
        }

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
        }

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
        }

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
    
        // Retirer un élève d'un cours (professeur)
        exports.removeStudentFromCourse = async (req, res) => {
            const Course = require('../models/Cours.model');
            try {
                const { courseId, studentId } = req.params;
                const course = await Course.findById(courseId);
                
                if (!course) return res.status(404).json({ message: 'Cours non trouvé' });
                
                // Vérifier si c'est bien le professeur du cours
                if (String(course.professor) !== String(req.user._id)) {
                    return res.status(403).json({ message: 'Accès interdit' });
                }
                
                // Retirer l'élève
                course.students = course.students.filter(id => String(id) !== String(studentId));
                await course.save();
                
                res.json({ success: true, message: 'Élève retiré du cours avec succès' });
            } catch (err) {
                res.status(500).json({ success: false, message: 'Erreur lors du retrait de l\'élève', error: err.message });
            }
        }
    
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
            }

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
            }

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
            }

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
            }

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
            }

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

            // Analytics professeur
            exports.getTeacherAnalytics = async (req, res) => {
                const teacherId = req.user._id;
                const Course = require('../models/Cours.model');
                try {
                    // Récupérer tous les cours du professeur
                    const courses = await Course.find({ professor: teacherId })
                        .select('title price students stats');

                    // Calculer les statistiques globales
                    const totalStudents = courses.reduce((acc, course) => acc + (course.students?.length || 0), 0);
                    const totalRevenue = courses.reduce((acc, course) => acc + (course.price * (course.students?.length || 0)), 0);
                    const totalCourses = courses.length;
                    
                    // Calculer la note moyenne
                    const coursesWithRating = courses.filter(c => c.stats?.averageRating > 0);
                    const averageRating = coursesWithRating.length > 0 
                        ? (coursesWithRating.reduce((acc, c) => acc + c.stats.averageRating, 0) / coursesWithRating.length).toFixed(1)
                        : 0;

                    res.json({
                        success: true,
                        totalStudents,
                        totalRevenue,
                        totalCourses,
                        averageRating,
                        monthlyRevenue: Math.round(totalRevenue / 12),
                        studentGrowth: 12,
                        revenueGrowth: 8.5,
                        courses: courses.map(c => ({
                            _id: c._id,
                            title: c.title,
                            students: c.students?.length || 0,
                            revenue: c.price * (c.students?.length || 0),
                            rating: c.stats?.averageRating || 0
                        }))
                    });
                } catch (err) {
                    res.status(500).json({ success: false, message: 'Erreur analytics professeur', error: err.message });
                }
            }

