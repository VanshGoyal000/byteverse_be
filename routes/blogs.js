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

// Apply specific middleware for the blog routes that might have large content
router.use(express.json({ limit: '10mb' }));
router.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Draft routes - Make sure these functions exist in the controller
router.get('/drafts', protect, getDraftBlogs || ((req, res) => {
  res.status(501).json({
    success: false,
    message: 'Draft functionality not implemented yet'
  });
}));

router.put('/drafts/:id', protect, updateDraftBlog || ((req, res) => {
  res.status(501).json({
    success: false,
    message: 'Draft update functionality not implemented yet'
  });
}));

router.post('/drafts/:id/publish', protect, publishDraft || ((req, res) => {
  res.status(501).json({
    success: false,
    message: 'Draft publishing functionality not implemented yet'
  });
}));

module.exports = router;
