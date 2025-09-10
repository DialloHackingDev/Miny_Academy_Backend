const jwt = require('jsonwebtoken');
const User = require('../models/Users.model');

// Middleware pour vérifier le token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const Aheader = req.header("Authorization");
    if (!Aheader) {
      return res.status(401).json({ success: false, message: 'Token d\'authentification requis' });
    }
    
    const token = Aheader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token d\'authentification requis' });
    }
    
    const decoded = jwt.verify(token, process.env.jwt_Secrety || 'your-secret-key');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Token invalide' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expiré' });
    }
    return res.status(500).json({ success: false, message: 'Erreur d\'authentification' });
  }
};

// Middleware pour vérifier si l'utilisateur est un professeur
const requireTeacher = (req, res, next) => {
  if (req.user.role !== 'prof' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Accès refusé. Rôle professeur requis.' 
    });
  }
  next();
};

// Middleware pour vérifier si l'utilisateur est un étudiant
const requireStudent = (req, res, next) => {
  if (req.user.role !== 'eleve' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Accès refusé. Rôle étudiant requis.' 
    });
  }
  next();
};

// Middleware pour vérifier si l'utilisateur est admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Accès refusé. Rôle administrateur requis.' 
    });
  }
  next();
};

// Middleware pour vérifier si l'utilisateur peut modifier un cours
const canModifyCourse = async (req, res, next) => {
  try {
    const Course = require('../models/Cours.model');
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cours non trouvé' 
      });
    }

    // Vérifier si l'utilisateur est le professeur du cours ou un admin
    if (course.professor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès refusé. Vous ne pouvez modifier que vos propres cours.' 
      });
    }

    req.course = course;
    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la vérification des permissions' 
    });
  }
};

module.exports = { 
  authenticateToken, 
  requireTeacher, 
  requireStudent, 
  requireAdmin,
  canModifyCourse
};
