const express = require('express');
const router = express.Router();
const { 
  getBlogs, 
  getBlog, 
  createBlog, 
  updateBlog, 
  deleteBlog,
  likeBlog,
  saveBlog, 
  getSavedBlogs,
  updateDraftBlog,
  getDraftBlogs,
  publishDraft
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

// Like/unlike a blog post
router.post('/:id/like', protect, likeBlog);

// Save/unsave blog for user's reading list
router.post('/:id/save', protect, saveBlog);

// Get user's saved blogs
router.get('/saved', protect, getSavedBlogs);

// Draft routes
router.get('/drafts', protect, getDraftBlogs);
router.put('/drafts/:id', protect, updateDraftBlog);
router.post('/drafts/:id/publish', protect, publishDraft);

module.exports = router;
