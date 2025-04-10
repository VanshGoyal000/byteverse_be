const express = require('express');
const router = express.Router();
const { 
  getBlogs, 
  getBlog, 
  createBlog, 
  updateBlog, 
  deleteBlog,
  likeBlog,
  getUserBlogs,
  getDraftBlogs,
  updateDraftBlog,
  publishDraft,
  addComment,
  deleteComment,
  saveBlog,
  getSavedBlogs
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
router.get('/user/drafts', protect, getDraftBlogs);
router.put('/drafts/:id', protect, updateDraftBlog);
router.put('/drafts/:id/publish', protect, publishDraft);

// Comments
router.post('/:id/comments', protect, addComment);
router.delete('/:id/comments/:commentId', protect, deleteComment);

// Likes
router.post('/:id/like', protect, likeBlog);

// Saved blogs
router.post('/:id/save', protect, saveBlog);
router.get('/user/saved', protect, getSavedBlogs);

module.exports = router;
