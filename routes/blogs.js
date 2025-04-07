const express = require('express');
const router = express.Router();
const { 
  getBlogs, 
  getBlog, 
  createBlog, 
  updateBlog, 
  deleteBlog,
  likeBlog 
} = require('../controllers/blogController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

// Get all blogs & create new blog
router.route('/')
  .get(getBlogs)
  .post(protect, createBlog);

// Get, update, delete specific blog
router.route('/:id')
  .get(optionalAuth, getBlog) // Use optionalAuth to check if user is the author
  .put(protect, updateBlog)
  .delete(protect, deleteBlog);

// Like/unlike a blog
router.post('/:id/like', protect, likeBlog);

module.exports = router;
