const mongoose = require('mongoose');

const ProgressionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    
    // ✅ Structure améliorée: array d'objets avec timestamp et score
    completedLessons: [{
        lessonId: { type: mongoose.Schema.Types.ObjectId }, // ID de la leçon
        moduleIndex: { type: Number }, // Index du module
        lessonIndex: { type: Number }, // Index de la leçon dans le module
        completedAt: { type: Date, default: Date.now },
        score: { type: Number, default: 0 }, // For quizzes: 0-100
        timeSpent: { type: Number, default: 0 }, // Secondes passées
        type: { type: String, enum: ['video', 'text', 'pdf', 'quiz'], default: 'video' }
    }],
    
    // Progress details
    progressPercentage: { type: Number, default: 0 },
    totalLessons: { type: Number, default: 0 },
    lastAccessedAt: { type: Date },
    totalTimeSpent: { type: Number, default: 0 }, // Secondes totales
    
    // Status tracking
    status: { 
        type: String, 
        enum: ['not-started', 'in-progress', 'completed'], 
        default: 'not-started' 
    },
    certificateEarned: { type: Boolean, default: false },
    certificateEarnedAt: { type: Date }
}, { timestamps: true });

// Index pour optimiser requêtes
ProgressionSchema.index({ userId: 1, courseId: 1 });
ProgressionSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Progression', ProgressionSchema);
