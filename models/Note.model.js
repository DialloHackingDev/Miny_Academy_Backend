const mongoose = require('../config/db');

const NoteSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lessonId: { type: String },
    lessonTitle: { type: String },
    username: { type: String, required: true },
    content: { type: String, required: true, trim: true, maxlength: 1000 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', NoteSchema);
