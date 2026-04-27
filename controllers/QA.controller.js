const Question = require('../models/Question.model');
const Course = require('../models/Cours.model');

module.exports = {
  getCourseQuestions: async (req, res) => {
    const { courseId } = req.params;
    try {
      const questions = await Question.find({ courseId })
        .sort({ createdAt: -1 });
      res.status(200).json({ success: true, questions });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur récupération Q&R', error: error.message });
    }
  },

  addQuestion: async (req, res) => {
    const { courseId } = req.params;
    const { question } = req.body;
    const userId = req.user._id;
    const username = req.user.username || req.user.email || 'Étudiant';
    try {
      const course = await Course.findById(courseId);
      if (!course) return res.status(404).json({ success: false, message: 'Cours non trouvé' });

      const newQuestion = new Question({
        courseId,
        userId,
        username,
        question: question.trim(),
        replies: []
      });

      await newQuestion.save();
      res.status(201).json({ success: true, question: newQuestion });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur ajout question', error: error.message });
    }
  },

  addReply: async (req, res) => {
    const { courseId, questionId } = req.params;
    const { reply } = req.body;
    const userId = req.user._id;
    const username = req.user.username || req.user.email || 'Étudiant';
    try {
      const question = await Question.findOne({ _id: questionId, courseId });
      if (!question) return res.status(404).json({ success: false, message: 'Question non trouvée' });

      question.replies.push({ userId, username, reply: reply.trim() });
      await question.save();
      res.status(201).json({ success: true, question });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur ajout réponse', error: error.message });
    }
  }
};
