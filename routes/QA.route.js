const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticateToken } = require('../middlewares/auth');
const qaController = require('../controllers/QA.controller');

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
  [param('courseId').isMongoId().withMessage('ID de cours invalide')],
  validate,
  qaController.getCourseQuestions
);

router.post(
  '/:courseId',
  authenticateToken,
  [
    param('courseId').isMongoId().withMessage('ID de cours invalide'),
    body('question').trim().notEmpty().withMessage('La question est obligatoire').isLength({ max: 500 }).withMessage('La question ne peut pas dépasser 500 caractères')
  ],
  validate,
  qaController.addQuestion
);

router.post(
  '/:courseId/reply/:questionId',
  authenticateToken,
  [
    param('courseId').isMongoId().withMessage('ID de cours invalide'),
    param('questionId').isMongoId().withMessage('ID de question invalide'),
    body('reply').trim().notEmpty().withMessage('La réponse est obligatoire').isLength({ max: 500 }).withMessage('La réponse ne peut pas dépasser 500 caractères')
  ],
  validate,
  qaController.addReply
);

module.exports = router;
