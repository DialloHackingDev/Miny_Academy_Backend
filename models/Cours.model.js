const mongoose = require("../config/db")

const CourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Le titre est obligatoire"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "La description est obligatoire"],
    },
    // Contenu flexible selon le type de cours
    content: {
      type: String,
      required: function() {
        return this.courseType === 'text';
      },
    },
    // Type de cours (texte, PDF, vidéo)
    courseType: {
      type: String,
      enum: ['text', 'pdf', 'video'],
      default: 'text',
      required: true,
    },
    //pour dire si un cour est gratuit ou non
    isFree: {
  type: Boolean,
  default: false
    },
    // 🎯 Catégorie du cours
    category: {
      type: String,
      enum: [
        'Développement Web',
        'Développement Mobile',
        'Data Science',
        'IA & Machine Learning',
        'DevOps & Cloud',
        'Conception & UI/UX',
        'Marketing Digital',
        'Gestion de Projet',
        'Langue & Communication',
        'Autre'
      ],
      default: 'Autre',
      required: true
    },
    // Fichier PDF (si courseType = 'pdf')
    pdfFile: {
      filename: String,
      originalName: String,
      path: String,
      size: Number,
      mimetype: String,
    },
    // Fichier vidéo (si courseType = 'video')
    videoFile: {
      filename: String,
      originalName: String,
      path: String,
      size: Number,
      mimetype: String,
    },
    // URL vidéo externe (YouTube, Vimeo, etc.)
    videoUrl: {
      type: String,
      validate: {
        validator: function(v) {
          if (this.courseType === 'video' && !this.videoFile.filename) {
            return v && v.length > 0;
          }
          return true;
        },
        message: 'URL vidéo requise si aucun fichier vidéo n\'est uploadé'
      }
    },
    price: {
      type: Number,
      default: 0, // gratuit si 0
    },
    professor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // l’utilisateur qui est le prof
      // required: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // étudiants inscrits
      },
    ],
    // Image de couverture du cours
    coverImage: {
      filename: String,
      originalName: String,
      path: String,
      size: Number,
      mimetype: String,
    },
    // Statistiques du cours
    stats: {
      totalViews: { type: Number, default: 0 },
      totalDownloads: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
    },
    // Modules et leçons du cours
    modules: [{
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      title: { type: String, required: true },
      description: { type: String },
      order: { type: Number, default: 0 },
      lessons: [{
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        title: { type: String, required: true },
        description: { type: String },
        type: { 
          type: String, 
          enum: ['video', 'text', 'pdf', 'quiz'],
          default: 'video'
        },
        content: { type: String }, // Pour le contenu texte
        videoUrl: { type: String }, // URL vidéo externe
        videoFile: {
          filename: String,
          originalName: String,
          path: String,
          size: Number,
          mimetype: String,
        },
        pdfFile: {
          filename: String,
          originalName: String,
          path: String,
          size: Number,
          mimetype: String,
        },
        duration: { type: Number, default: 0 }, // Durée en minutes
        order: { type: Number, default: 0 },
        isFree: { type: Boolean, default: false }, // Leçon gratuite (aperçu)
      }]
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", CourseSchema);

