const Progression = require('../models/Progression.model');
const Course = require('../models/Cours.model');

// ✅ Helper: Calculer le nombre total de leçons dans un cours
const calculateTotalLessons = (course) => {
  if (!course.modules || course.modules.length === 0) {
    return 0;
  }
  return course.modules.reduce((total, module) => {
    return total + (module.lessons ? module.lessons.length : 0);
  }, 0);
};

// ✅ Helper: Calculer le pourcentage de progression
const calculateProgressPercentage = (completedCount, totalLessons) => {
  if (totalLessons === 0) return 0;
  return Math.round((completedCount / totalLessons) * 100);
};

// ✅ Helper: Déterminer le statut
const determineStatus = (percentage) => {
  if (percentage === 0) return 'not-started';
  if (percentage === 100) return 'completed';
  return 'in-progress';
};

module.exports = {
    // ✅ Marquer une leçon comme complétée
    markLessonCompleted: async (req, res) => {
        try {
            const userId = req.user._id || req.user.id;
            const { courseId, lessonId } = req.params;
            const { timeSpent = 0, score = 0 } = req.body;

            // ✅ Validation
            if (!courseId || !lessonId) {
                return res.status(400).json({
                    success: false,
                    msg: "courseId et lessonId sont requis"
                });
            }

            // ✅ Vérifier que le cours existe
            const course = await Course.findById(courseId);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    msg: "Cours non trouvé"
                });
            }

            // ✅ Vérifier que l'utilisateur est inscrit au cours
            if (!course.students.includes(userId)) {
                return res.status(403).json({
                    success: false,
                    msg: "Vous devez être inscrit à ce cours pour marquer les leçons"
                });
            }

            // ✅ Trouver la leçon dans le cours pour valider qu'elle existe
            let foundLesson = null;
            let moduleIndex = -1;
            let lessonIndex = -1;
            let lessonType = 'video';

            for (let mIdx = 0; mIdx < course.modules.length; mIdx++) {
                for (let lIdx = 0; lIdx < course.modules[mIdx].lessons.length; lIdx++) {
                    if (course.modules[mIdx].lessons[lIdx]._id.toString() === lessonId) {
                        foundLesson = course.modules[mIdx].lessons[lIdx];
                        moduleIndex = mIdx;
                        lessonIndex = lIdx;
                        lessonType = foundLesson.type || 'video';
                        break;
                    }
                }
                if (foundLesson) break;
            }

            if (!foundLesson) {
                return res.status(404).json({
                    success: false,
                    msg: "Leçon non trouvée dans ce cours"
                });
            }

            // ✅ Récupérer ou créer la progression
            let progression = await Progression.findOne({ userId, courseId });
            
            if (!progression) {
                const totalLessons = calculateTotalLessons(course);
                progression = new Progression({
                    userId,
                    courseId,
                    completedLessons: [],
                    totalLessons,
                    status: 'not-started'
                });
            }

            // ✅ Vérifier si la leçon est déjà marquée complétée
            const alreadyCompleted = progression.completedLessons.some(
                cl => cl.lessonId && cl.lessonId.toString() === lessonId
            );

            if (!alreadyCompleted) {
                // ✅ Ajouter la leçon complétée avec tous les détails
                progression.completedLessons.push({
                    lessonId,
                    moduleIndex,
                    lessonIndex,
                    completedAt: new Date(),
                    score: Math.min(100, Math.max(0, score)), // 0-100
                    timeSpent: Math.max(0, timeSpent),
                    type: lessonType
                });

                // ✅ Ajouter au temps total
                progression.totalTimeSpent = (progression.totalTimeSpent || 0) + timeSpent;
            }

            // ✅ Recalculer le pourcentage
            progression.progressPercentage = calculateProgressPercentage(
                progression.completedLessons.length,
                progression.totalLessons
            );

            // ✅ Mettre à jour le statut et last accessed
            progression.status = determineStatus(progression.progressPercentage);
            progression.lastAccessedAt = new Date();

            // ✅ Si 100% complétée, marquer certificateEarned
            if (progression.progressPercentage === 100 && !progression.certificateEarned) {
                progression.certificateEarned = true;
                progression.certificateEarnedAt = new Date();
            }

            await progression.save();

            return res.status(200).json({
                success: true,
                msg: "Leçon marquée comme complétée",
                data: {
                    progressPercentage: progression.progressPercentage,
                    completedLessonsCount: progression.completedLessons.length,
                    totalLessons: progression.totalLessons,
                    status: progression.status,
                    certificateEarned: progression.certificateEarned,
                    totalTimeSpent: progression.totalTimeSpent
                }
            });

        } catch (error) {
            console.error("Erreur markLessonCompleted:", error);
            return res.status(500).json({
                success: false,
                msg: "Erreur lors de la mise à jour de la progression"
            });
        }
    },

    // ✅ Récupérer la progression complète d'un utilisateur sur un cours
    getProgression: async (req, res) => {
        try {
            const userId = req.user._id || req.user.id;
            const { courseId } = req.params;

            // ✅ Validation
            if (!courseId) {
                return res.status(400).json({
                    success: false,
                    msg: "courseId est requis"
                });
            }

            // ✅ Vérifier que le cours existe
            const course = await Course.findById(courseId);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    msg: "Cours non trouvé"
                });
            }

            // ✅ Vérifier que l'utilisateur est inscrit
            if (!course.students.includes(userId)) {
                return res.status(403).json({
                    success: false,
                    msg: "Vous devez être inscrit à ce cours pour voir votre progression"
                });
            }

            // ✅ Récupérer la progression
            let progression = await Progression.findOne({ userId, courseId });

            // Si no progression, créer une
            if (!progression) {
                const totalLessons = calculateTotalLessons(course);
                progression = new Progression({
                    userId,
                    courseId,
                    completedLessons: [],
                    totalLessons,
                    progressPercentage: 0,
                    status: 'not-started'
                });
                await progression.save();
            }

            // ✅ Populer avec détails du cours pour frontend
            const modules = course.modules.map((module, mIdx) => ({
                moduleId: module._id,
                title: module.title,
                description: module.description,
                order: module.order,
                lessons: module.lessons.map((lesson, lIdx) => {
                    const isCompleted = progression.completedLessons.some(
                        cl => cl.lessonId && cl.lessonId.toString() === lesson._id.toString()
                    );
                    const completedLesson = progression.completedLessons.find(
                        cl => cl.lessonId && cl.lessonId.toString() === lesson._id.toString()
                    );

                    return {
                        lessonId: lesson._id,
                        title: lesson.title,
                        type: lesson.type,
                        duration: lesson.duration,
                        order: lesson.order,
                        isFree: lesson.isFree,
                        isCompleted,
                        completedAt: completedLesson?.completedAt || null,
                        timeSpent: completedLesson?.timeSpent || 0,
                        score: completedLesson?.score || 0
                    };
                })
            }));

            return res.status(200).json({
                success: true,
                data: {
                    courseId,
                    courseName: course.title,
                    progressPercentage: progression.progressPercentage,
                    status: progression.status,
                    completedLessonsCount: progression.completedLessons.length,
                    totalLessons: progression.totalLessons,
                    totalTimeSpent: progression.totalTimeSpent,
                    lastAccessedAt: progression.lastAccessedAt,
                    certificateEarned: progression.certificateEarned,
                    certificateEarnedAt: progression.certificateEarnedAt,
                    modules
                }
            });

        } catch (error) {
            console.error("Erreur getProgression:", error);
            return res.status(500).json({
                success: false,
                msg: "Erreur lors de la récupération de la progression"
            });
        }
    },

    // ✅ BONUS: Récupérer tous les cours d'un utilisateur avec leur progression
    getUserProgress: async (req, res) => {
        try {
            const userId = req.user._id || req.user.id;

            const progressions = await Progression.find({ userId })
                .populate('courseId', 'title description stats')
                .sort({ updatedAt: -1 });

            return res.status(200).json({
                success: true,
                data: progressions.map(p => ({
                    courseId: p.courseId._id,
                    courseName: p.courseId.title,
                    progressPercentage: p.progressPercentage,
                    status: p.status,
                    completedLessonsCount: p.completedLessons.length,
                    totalLessons: p.totalLessons,
                    totalTimeSpent: p.totalTimeSpent,
                    certificateEarned: p.certificateEarned,
                    lastAccessedAt: p.lastAccessedAt
                }))
            });

        } catch (error) {
            console.error("Erreur getUserProgress:", error);
            return res.status(500).json({
                success: false,
                msg: "Erreur lors de la récupération des progressions"
            });
        }
    },

    // ✅ BONUS: Réinitialiser la progression d'un cours
    resetProgression: async (req, res) => {
        try {
            const userId = req.user._id || req.user.id;
            const { courseId } = req.params;

            const progression = await Progression.findOne({ userId, courseId });
            if (!progression) {
                return res.status(404).json({
                    success: false,
                    msg: "Progression non trouvée"
                });
            }

            progression.completedLessons = [];
            progression.progressPercentage = 0;
            progression.status = 'not-started';
            progression.certificateEarned = false;
            progression.totalTimeSpent = 0;

            await progression.save();

            return res.status(200).json({
                success: true,
                msg: "Progression réinitialisée"
            });

        } catch (error) {
            console.error("Erreur resetProgression:", error);
            return res.status(500).json({
                success: false,
                msg: "Erreur lors de la réinitialisation"
            });
        }
    },
    
    // ✅ Public verification of certificate
    verifyPublicCertificate: async (req, res) => {
        try {
            const { courseId, userId } = req.params;
            
            const progression = await Progression.findOne({ userId, courseId });
            if (!progression || !progression.certificateEarned) {
                return res.status(404).json({ success: false, msg: "Certificat non trouvé ou non valide" });
            }
            
            const course = await Course.findById(courseId).select('title');
            
            return res.status(200).json({
                success: true,
                data: {
                    courseTitle: course?.title,
                    progressPercentage: progression.progressPercentage,
                    certificateEarnedAt: progression.certificateEarnedAt,
                    status: progression.status
                }
            });
        } catch (error) {
            console.error("Erreur verifyPublicCertificate:", error);
            return res.status(500).json({ success: false, msg: "Erreur serveur lors de la vérification" });
        }
    }
};
