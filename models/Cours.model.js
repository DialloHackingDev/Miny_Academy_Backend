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
    // Statistiques du cours
    stats: {
      totalViews: { type: Number, default: 0 },
      totalDownloads: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", CourseSchema);

