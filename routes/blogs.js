const express = require('express');
const router = express.Router();
const { 
  getBlogs, 
  getBlog, 
  createBlog, 
  updateBlog, 
  deleteBlog,
  getUserBlogs,
  likeBlog,
  addComment,
  deleteComment
} = require('../controllers/blogController');

const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getBlogs);
router.get('/:id', getBlog);

// Protected routes
router.post('/', protect, createBlog);
router.put('/:id', protect, updateBlog);
router.delete('/:id', protect, deleteBlog);
router.get('/user/blogs', protect, getUserBlogs);
router.put('/:id/like', protect, likeBlog);
router.post('/:id/comments', protect, addComment);
router.delete('/:id/comments/:commentId', protect, deleteComment);

module.exports = router;
