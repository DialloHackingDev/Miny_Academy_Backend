const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticateToken } = require('../middlewares/auth');
const noteController = require('../controllers/Note.controller');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

const router = express.Router();

router.get(
  '/:courseId',
  authenticateToken,
  [param('courseId').isMongoId().withMessage('ID de cours invalide')],
  validate,
  noteController.getCourseNotes
);

router.post(
  '/:courseId',
  authenticateToken,
  [
    param('courseId').isMongoId().withMessage('ID de cours invalide'),
    body('content').trim().notEmpty().withMessage('Le contenu est obligatoire').isLength({ max: 1000 }).withMessage('La note ne peut pas dépasser 1000 caractères')
  ],
  validate,
  noteController.addNote
);

router.delete(
  '/:courseId/:noteId',
  authenticateToken,
  [
    param('courseId').isMongoId().withMessage('ID de cours invalide'),
    param('noteId').isMongoId().withMessage('ID de note invalide')
  ],
  validate,
  noteController.deleteNote
);

module.exports = router;
