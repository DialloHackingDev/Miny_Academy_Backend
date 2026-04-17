const Course = require("../models/Cours.model");
const { deleteFile } = require("../middlewares/upload");

// 🔹 Créer un cours (professeur ou admin)
exports.createCourse = async (req, res) => {
  try {
    console.log('=== CREATE COURSE CONTROLLER ===');
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);
    console.log('req.user:', req.user);
    
    const { title, description, content, price, courseType, videoUrl } = req.body;
    
    console.log('Extracted values:', { title, description, content, price, courseType, videoUrl });
    
    // Validation du type de cours
    if (!courseType || !['text', 'pdf', 'video'].includes(courseType)) {
      console.log('Invalid courseType:', courseType);
      return res.status(401).json({ 
        success: false, 
        message: 'Type de cours invalide. Types acceptés: text, pdf, video' 
      });
    }

    // Préparer les données du cours
    const courseData = {
      title,
      description,
      price: parseFloat(price) || 0,
      courseType,
      professor: req.user._id,
    };
    console.log(req.body)
    console.log(courseData)

    // Gérer le contenu selon le type
    if (courseType === 'text') {
      if (!content) {
        return res.status(401).json({ 
          success: false, 
          message: 'Le contenu est obligatoire pour un cours de type texte' 
        });
      }
      courseData.content = content;
    } else if (courseType === 'pdf') {
      if (!req.files || !req.files.pdfFile) {
        return res.status(401).json({ 
          success: false, 
          message: 'Un fichier PDF est obligatoire pour un cours de type PDF' 
        });
      }
      
      const pdfFile = req.files.pdfFile[0];
      courseData.pdfFile = {
        filename: pdfFile.filename,
        originalName: pdfFile.originalname,
        path: pdfFile.path,
        size: pdfFile.size,
        mimetype: pdfFile.mimetype,
      };
    } else if (courseType === 'video') {
      if (req.files && req.files.videoFile) {
        // Fichier vidéo uploadé
        const videoFile = req.files.videoFile[0];
        courseData.videoFile = {
          filename: videoFile.filename,
          originalName: videoFile.originalname,
          path: videoFile.path,
          size: videoFile.size,
          mimetype: videoFile.mimetype,
        };
      } else if (videoUrl) {
        // URL vidéo externe
        courseData.videoUrl = videoUrl;
      } else {
        return res.status(401).json({ 
          success: false, 
          message: 'Un fichier vidéo ou une URL vidéo est obligatoire pour un cours de type vidéo' 
        });
      }
    }

    // Gérer l'image de couverture
    if (req.files && req.files.coverImage) {
      const coverImage = req.files.coverImage[0];
      courseData.coverImage = {
        filename: coverImage.filename,
        originalName: coverImage.originalname,
        path: coverImage.path,
        size: coverImage.size,
        mimetype: coverImage.mimetype,
      };
    }

    const course = await Course.create(courseData);

    res.status(201).json({ 
      success: true, 
      message: 'Cours créé avec succès',
      data: course 
    });
  } catch (error) {
    console.error('=== CREATE COURSE ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    
    // Nettoyer les fichiers en cas d'erreur
    if (req.files) {
      Object.values(req.files).forEach(files => {
        files.forEach(file => {
          deleteFile(file.path);
        });
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message,
      stack: error.stack 
    });
  }
};

// 🔹 Lister tous les cours
exports.getCourses = async (req, res) => {
  try {
    const { search, price, popular, rating, category } = req.query;
    let query = {};

    // Recherche par mots-clés
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filtre prix
    if (price === 'free') query.price = 0;
    if (price === 'paid') query.price = { $gt: 0 };

    // Filtre catégorie (si champ category existe)
    if (category) query.category = category;

    let courses = await Course.find(query)
      .populate("professor", "username email role")
      .populate("students", "username email");

    // Filtre popularité
    if (popular === 'true') {
      courses = courses.sort((a, b) => b.students.length - a.students.length);
    }

    // Filtre note moyenne
    if (rating) {
      // Récupérer les notes pour chaque cours
      const Review = require('../models/Review.model');
      const coursesWithRating = await Promise.all(courses.map(async course => {
        const reviews = await Review.find({ courseId: course._id });
        const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) : 0;
        return { ...course._doc, avgRating };
      }));
      courses = coursesWithRating.filter(c => c.avgRating >= Number(rating));
    }

    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔹 Détail d’un cours
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("professor", "username email role")
      .populate("students", "username email");

    if (!course) return res.status(404).json({ message: "Cours non trouvé" });

    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔹 Modifier un cours (professeur ou admin)
exports.updateCourse = async (req, res) => {
  try {
    console.log('=== UPDATE COURSE ===');
    console.log('Course ID:', req.params.id);
    console.log('User:', req.user);
    console.log('Body:', req.body);
    console.log('Files:', req.files);
    
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Cours non trouvé" });

    // Vérification : seul le prof ou admin peut modifier
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    console.log('Comparing professor:', course.professor.toString(), 'with user:', userId);
    if (course.professor.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const { title, description, content, price, courseType, videoUrl } = req.body;
    console.log('Extracted values:', { title, description, content, price, courseType, videoUrl });
    
    // Validation du courseType
    const validCourseTypes = ['text', 'pdf', 'video'];
    if (courseType && !validCourseTypes.includes(courseType)) {
      return res.status(400).json({ 
        success: false, 
        message: `Type de cours invalide. Valeurs acceptées: ${validCourseTypes.join(', ')}` 
      });
    }
    
    // Mettre à jour les champs de base
    course.title = title || course.title;
    course.description = description || course.description;
    course.price = price !== undefined ? parseFloat(price) : course.price;
    
    // Gérer le changement de type de cours
    if (courseType && courseType !== course.courseType) {
      course.courseType = courseType;
      
      // Nettoyer les anciens fichiers si le type change
      if (courseType === 'text') {
        course.content = content || '';
        course.pdfFile = undefined;
        course.videoFile = undefined;
        course.videoUrl = undefined;
      } else if (courseType === 'pdf') {
        course.content = undefined;
        course.videoFile = undefined;
        course.videoUrl = undefined;
        
        // Supprimer l'ancien fichier PDF s'il existe
        if (course.pdfFile && course.pdfFile.path) {
          deleteFile(course.pdfFile.path);
        }
        
        // Traiter le nouveau fichier PDF
        if (req.files && req.files.pdfFile) {
          const pdfFile = req.files.pdfFile[0];
          course.pdfFile = {
            filename: pdfFile.filename,
            originalName: pdfFile.originalname,
            path: pdfFile.path,
            size: pdfFile.size,
            mimetype: pdfFile.mimetype,
          };
        }
      } else if (courseType === 'video') {
        course.content = undefined;
        course.pdfFile = undefined;
        
        // Supprimer l'ancien fichier vidéo s'il existe
        if (course.videoFile && course.videoFile.path) {
          deleteFile(course.videoFile.path);
        }
        
        // Traiter le nouveau fichier vidéo ou URL
        if (req.files && req.files.videoFile) {
          const videoFile = req.files.videoFile[0];
          course.videoFile = {
            filename: videoFile.filename,
            originalName: videoFile.originalname,
            path: videoFile.path,
            size: videoFile.size,
            mimetype: videoFile.mimetype,
          };
          course.videoUrl = undefined;
        } else if (videoUrl) {
          course.videoUrl = videoUrl;
          course.videoFile = undefined;
        }
      }
    } else {
      // Mise à jour du contenu selon le type actuel
      if (course.courseType === 'text') {
        course.content = content || course.content;
      } else if (course.courseType === 'pdf' && req.files && req.files.pdfFile) {
        // Remplacer le fichier PDF existant
        if (course.pdfFile && course.pdfFile.path) {
          deleteFile(course.pdfFile.path);
        }
        
        const pdfFile = req.files.pdfFile[0];
        course.pdfFile = {
          filename: pdfFile.filename,
          originalName: pdfFile.originalname,
          path: pdfFile.path,
          size: pdfFile.size,
          mimetype: pdfFile.mimetype,
        };
      } else if (course.courseType === 'video') {
        if (req.files && req.files.videoFile) {
          // Remplacer le fichier vidéo existant
          if (course.videoFile && course.videoFile.path) {
            deleteFile(course.videoFile.path);
          }
          
          const videoFile = req.files.videoFile[0];
          course.videoFile = {
            filename: videoFile.filename,
            originalName: videoFile.originalname,
            path: videoFile.path,
            size: videoFile.size,
            mimetype: videoFile.mimetype,
          };
          course.videoUrl = undefined;
        } else if (videoUrl) {
          course.videoUrl = videoUrl;
          course.videoFile = undefined;
        }
      }
    }

    // Gérer l'image de couverture
    if (req.files && req.files.coverImage) {
      // Supprimer l'ancienne image de couverture s'il existe
      if (course.coverImage && course.coverImage.path) {
        deleteFile(course.coverImage.path);
      }
      
      const coverImage = req.files.coverImage[0];
      course.coverImage = {
        filename: coverImage.filename,
        originalName: coverImage.originalname,
        path: coverImage.path,
        size: coverImage.size,
        mimetype: coverImage.mimetype,
      };
    }

    console.log('Saving course:', course);
    await course.save();
    console.log('Course saved successfully');
    res.json({ success: true, message: 'Cours modifié avec succès', data: course });
  } catch (error) {
    console.error('Error in updateCourse:', error);
    
    // Nettoyer les fichiers en cas d'erreur
    if (req.files) {
      Object.values(req.files).forEach(files => {
        files.forEach(file => {
          deleteFile(file.path);
        });
      });
    }
    
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
};

// 🔹 Supprimer un cours (professeur ou admin)
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Cours non trouvé" });

    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    if (course.professor.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Accès refusé" });
    }

    // Supprimer les fichiers associés
    if (course.pdfFile && course.pdfFile.path) {
      deleteFile(course.pdfFile.path);
    }
    if (course.videoFile && course.videoFile.path) {
      deleteFile(course.videoFile.path);
    }
    if (course.coverImage && course.coverImage.path) {
      deleteFile(course.coverImage.path);
    }

    await Course.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Cours supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔹 Inscription à un cours (étudiant)
exports.enrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Cours non trouvé" });

    // Vérifie si l'étudiant est déjà inscrit
    if (course.students.includes(req.user._id)) {
      return res.status(400).json({ message: "Déjà inscrit à ce cours" });
    }

    course.students.push(req.user._id);
    await course.save();

    res.json({ success: true, message: "Inscription réussie", data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔹 Télécharger un fichier de cours (étudiant inscrit)
exports.downloadCourseFile = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: "Cours non trouvé" });
    }

    // Vérifier si l'étudiant est inscrit au cours
    if (!course.students.includes(req.user._id)) {
      return res.status(403).json({ 
        success: false, 
        message: "Vous devez être inscrit à ce cours pour télécharger les fichiers" 
      });
    }

    const fileType = req.params.fileType; // 'pdf' ou 'video'
    
    if (fileType === 'pdf' && course.pdfFile) {
      // Incrémenter le compteur de téléchargements
      course.stats.totalDownloads += 1;
      await course.save();
      
      res.download(course.pdfFile.path, course.pdfFile.originalName);
    } else if (fileType === 'video' && course.videoFile) {
      // Incrémenter le compteur de téléchargements
      course.stats.totalDownloads += 1;
      await course.save();
      
      res.download(course.videoFile.path, course.videoFile.originalName);
    } else {
      return res.status(404).json({ 
        success: false, 
        message: "Fichier non trouvé pour ce cours" 
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔹 Obtenir les statistiques d'un cours (professeur)
exports.getCourseStats = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: "Cours non trouvé" });
    }

    // Vérifier si l'utilisateur est le professeur du cours ou un admin
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    if (course.professor.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Accès refusé. Vous ne pouvez voir que les statistiques de vos propres cours." 
      });
    }

    res.json({ 
      success: true, 
      data: {
        courseId: course._id,
        title: course.title,
        stats: course.stats,
        totalStudents: course.students.length,
        createdAt: course.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
