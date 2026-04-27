const Course = require("../models/Cours.model");
const { deleteFile } = require("../middlewares/upload");

// Helper function to map files to modules/lessons
const mapFilesToModules = (modules, files) => {
  if (!modules || !files || files.length === 0) return modules;
  
  const updatedModules = [...modules];
  
  files.forEach(file => {
    // Expected format: lesson_file_mIdx_lIdx
    if (file.fieldname.startsWith('lesson_file_')) {
      const parts = file.fieldname.split('_');
      const mIdx = parseInt(parts[2]);
      const lIdx = parseInt(parts[3]);
      
      if (updatedModules[mIdx] && updatedModules[mIdx].lessons[lIdx]) {
        const lesson = updatedModules[mIdx].lessons[lIdx];
        const fileData = {
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          size: file.size,
          mimetype: file.mimetype,
        };
        
        if (lesson.type === 'video') {
          lesson.videoFile = fileData;
        } else if (lesson.type === 'pdf') {
          lesson.pdfFile = fileData;
        }
      }
    }
  });
  
  return updatedModules;
};

// 🔹 Créer un cours (professeur ou admin)
exports.createCourse = async (req, res) => {
  try {
    const { title, description, content, price, courseType, videoUrl, category, modules } = req.body;
    
    // Preparation
    let parsedModules = modules ? (typeof modules === 'string' ? JSON.parse(modules) : modules) : [];
    
    // Map lesson files if any
    if (req.files && req.files.length > 0) {
      parsedModules = mapFilesToModules(parsedModules, req.files);
    }

    const courseData = {
      title,
      description,
      price: parseFloat(price) || 0,
      courseType: courseType || 'video',
      category: category || 'Autre',
      professor: req.user._id,
      modules: parsedModules
    };

    // Handle Root Cover Image
    const coverFile = req.files?.find(f => f.fieldname === 'coverImage');
    if (coverFile) {
      courseData.coverImage = {
        filename: coverFile.filename,
        originalName: coverFile.originalname,
        path: coverFile.path,
        size: coverFile.size,
        mimetype: coverFile.mimetype,
      };
    }

    const course = await Course.create(courseData);

    res.status(201).json({ 
      success: true, 
      message: 'Cours créé avec succès',
      data: course 
    });
  } catch (error) {
    console.error('CREATE COURSE ERROR:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔹 Lister tous les cours
exports.getCourses = async (req, res) => {
  try {
    const { search, price, category } = req.query;
    let query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (price === 'free') query.price = 0;
    if (price === 'paid') query.price = { $gt: 0 };
    if (category) query.category = category;

    const courses = await Course.find(query).populate("professor", "username email role");
    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔹 Détail d’un cours
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate("professor", "username email role");
    if (!course) return res.status(404).json({ message: "Cours non trouvé" });
    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔹 Modifier un cours
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Cours non trouvé" });

    // Auth check
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    if (course.professor.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const { title, description, price, category, modules } = req.body;
    
    course.title = title || course.title;
    course.description = description || course.description;
    course.price = price !== undefined ? parseFloat(price) : course.price;
    course.category = category || course.category;

    if (modules) {
      let parsedModules = typeof modules === 'string' ? JSON.parse(modules) : modules;
      // Map new files if any
      if (req.files && req.files.length > 0) {
        parsedModules = mapFilesToModules(parsedModules, req.files);
      }
      course.modules = parsedModules;
    }

    // Handle Cover Image
    const coverFile = req.files?.find(f => f.fieldname === 'coverImage');
    if (coverFile) {
      if (course.coverImage?.path) deleteFile(course.coverImage.path);
      course.coverImage = {
        filename: coverFile.filename,
        originalName: coverFile.originalname,
        path: coverFile.path,
        size: coverFile.size,
        mimetype: coverFile.mimetype,
      };
    }

    await course.save();
    res.json({ success: true, message: 'Cours modifié avec succès', data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔹 Supprimer un cours
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Cours non trouvé" });

    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    if (course.professor.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Accès refusé" });
    }

    // Delete files
    if (course.coverImage?.path) deleteFile(course.coverImage.path);
    course.modules.forEach(m => {
      m.lessons.forEach(l => {
        if (l.videoFile?.path) deleteFile(l.videoFile.path);
        if (l.pdfFile?.path) deleteFile(l.pdfFile.path);
      });
    });

    await Course.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Cours supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔹 Inscription
exports.enrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Cours non trouvé" });
    if (course.students.includes(req.user._id)) return res.status(400).json({ message: "Déjà inscrit" });
    course.students.push(req.user._id);
    await course.save();
    res.json({ success: true, message: "Inscription réussie", data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔹 Télécharger (simplifié)
exports.downloadCourseFile = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course || !course.students.includes(req.user._id)) return res.status(403).json({ message: "Accès refusé" });
    // Logic for downloading files from lessons could be added here
    res.status(404).json({ message: "Not implemented for lesson files yet" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔹 Stats
exports.getCourseStats = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Cours non trouvé" });
    res.json({ success: true, data: { totalStudents: course.students.length, stats: course.stats } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔹 Toggle Favorite (Like/Unlike)
exports.toggleFavorite = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Cours non trouvé" });

    const userId = req.user._id;
    const isFavored = course.lovers.some(id => id.toString() === userId.toString());

    if (isFavored) {
      // Remove from favorites
      course.lovers = course.lovers.filter(id => id.toString() !== userId.toString());
    } else {
      // Add to favorites
      if (!course.lovers.some(id => id.toString() === userId.toString())) {
        course.lovers.push(userId);
      }
    }

    await course.save();
    res.json({ 
      success: true, 
      message: isFavored ? "Removed from favorites" : "Added to favorites",
      isFavored: !isFavored,
      favoritesCount: course.lovers.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔹 Get User Favorites
exports.getUserFavorites = async (req, res) => {
  try {
    const userId = req.user._id;
    const courses = await Course.find({ lovers: userId }).populate("professor", "username email role");
    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔹 Check if Course is Favored
exports.checkIsFavored = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Cours non trouvé" });

    const userId = req.user._id;
    const isFavored = course.lovers.some(id => id.toString() === userId.toString());

    res.json({ 
      success: true, 
      isFavored,
      favoritesCount: course.lovers.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
