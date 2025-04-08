const express = require('express');
const router = express.Router();
const { 
  getBlogs, 
  getBlog, 
  createBlog, 
  updateBlog, 
  deleteBlog,
  getSavedBlogs,
  getUserBlogs,
  likeBlog
} = require('../controllers/blogController');
const { protect } = require('../middleware/auth');

// Import comments router
const commentRouter = require('./comments');

// Apply specific middleware for the blog routes that might have large content
router.use(express.json({ limit: '10mb' }));
router.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Special routes that need to be defined BEFORE the /:id route
router.get('/saved', protect, getSavedBlogs);
router.get('/user/blogs', protect, getUserBlogs);

// Regular CRUD routes
router.route('/')
  .get(getBlogs)
  .post(protect, createBlog);

// This route should come AFTER any other specific routes
router.route('/:id')
  .get(getBlog)
  .put(protect, updateBlog)
  .delete(protect, deleteBlog);

// Like a blog
router.route('/:id/like')
  .post(likeBlog);

// Re-route into comment router
router.use('/:blogId/comments', commentRouter);

module.exports = router;
