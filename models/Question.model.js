const mongoose = require('../config/db');

const ReplySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  reply: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const QuestionSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    question: { type: String, required: true, trim: true, maxlength: 500 },
    replies: [ReplySchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', QuestionSchema);
