const Note = require('../models/Note.model');
const Course = require('../models/Cours.model');

module.exports = {
  getCourseNotes: async (req, res) => {
    const { courseId } = req.params;
    try {
      const notes = await Note.find({ courseId, userId: req.user._id }).sort({ createdAt: -1 });
      res.status(200).json({ success: true, notes });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur récupération notes', error: error.message });
    }
  },

  addNote: async (req, res) => {
    const { courseId } = req.params;
    const { content, lessonId, lessonTitle } = req.body;
    try {
      const course = await Course.findById(courseId);
      if (!course) return res.status(404).json({ success: false, message: 'Cours non trouvé' });

      const note = new Note({
        courseId,
        userId: req.user._id,
        lessonId,
        lessonTitle,
        username: req.user.username || req.user.email || 'Étudiant',
        content: content.trim()
      });

      await note.save();
      res.status(201).json({ success: true, note });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur ajout note', error: error.message });
    }
  },

  deleteNote: async (req, res) => {
    const { courseId, noteId } = req.params;
    try {
      const note = await Note.findOne({ _id: noteId, courseId, userId: req.user._id });
      if (!note) return res.status(404).json({ success: false, message: 'Note non trouvée' });

      await note.deleteOne();
      res.status(200).json({ success: true, message: 'Note supprimée', noteId });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur suppression note', error: error.message });
    }
  }
};
