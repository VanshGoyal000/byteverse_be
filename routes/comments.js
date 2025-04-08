const express = require('express');
const router = express.Router({ mergeParams: true });
const { 
  getComments,
  addComment,
  deleteComment,
  likeComment
} = require('../controllers/commentController');
const { protect, authorize } = require('../middleware/auth');

// Routes
router.route('/')
  .get(getComments)
  .post(addComment);

router.route('/:commentId')
  .delete(protect, deleteComment);

router.route('/:commentId/like')
  .post(likeComment);

module.exports = router;
