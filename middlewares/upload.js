const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration du stockage des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Créer le dossier d'upload s'il n'existe pas
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Créer des sous-dossiers selon le type de fichier
    let subDir = 'general';
    if (file.fieldname === 'pdfFile') {
      subDir = 'pdfs';
    } else if (file.fieldname === 'videoFile') {
      subDir = 'videos';
    }
    
    const finalDir = path.join(uploadDir, subDir);
    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }
    
    cb(null, finalDir);
  },
  filename: function (req, file, cb) {
    // Générer un nom de fichier unique avec timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Filtre des fichiers
const fileFilter = (req, file, cb) => {
  // Vérifier le type de fichier
  if (file.fieldname === 'pdfFile') {
    // Accepter seulement les PDFs
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF sont acceptés'), false);
    }
  } else if (file.fieldname === 'videoFile') {
    // Accepter les formats vidéo courants
    const allowedMimeTypes = [
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/flv',
      'video/webm'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format vidéo non supporté. Formats acceptés: MP4, AVI, MOV, WMV, FLV, WEBM'), false);
    }
  } else {
    cb(null, true);
  }
};

// Configuration de Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
    files: 2 // Maximum 2 fichiers (PDF + vidéo)
  }
});

// Middleware pour l'upload de cours
const uploadCourseFiles = upload.fields([
  { name: 'pdfFile', maxCount: 1 },
  { name: 'videoFile', maxCount: 1 }
]);

// Middleware pour nettoyer les fichiers en cas d'erreur
const cleanupFiles = (req, res, next) => {
  // Si des fichiers ont été uploadés mais qu'il y a une erreur
  if (req.files) {
    req.on('error', () => {
      // Nettoyer les fichiers uploadés en cas d'erreur
      Object.values(req.files).forEach(files => {
        files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      });
    });
  }
  next();
};

// Fonction pour supprimer un fichier
const deleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
};

module.exports = {
  uploadCourseFiles,
  cleanupFiles,
  deleteFile
};


