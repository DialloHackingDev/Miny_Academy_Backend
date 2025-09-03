const mongoose = require('mongoose');

const ProgressionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    completedLessons: [{ type: String }], // ID ou nom de la leçon
    progressPercentage: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Progression', ProgressionSchema);
