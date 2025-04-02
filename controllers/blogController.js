const Blog = require('../models/Blog');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// @desc    Get all blogs (with filters and pagination)
// @route   GET /api/blogs
// @access  Public
exports.getBlogs = async (req, res) => {
  try {
    // Build query
    let query = {};
    
    // Public API only returns published posts
    query.published = true;
    
    // Filter by category, tag, author
    if (req.query.category) {
      query.categories = req.query.category;
    }
    
    if (req.query.tag) {
      query.tags = req.query.tag;
    }
    
    if (req.query.author) {
      // Find author by slug or ID
      let author;
      if (mongoose.Types.ObjectId.isValid(req.query.author)) {
        author = await User.findById(req.query.author);
      }
      
      if (author) {
        query.author = author._id;
      }
    }
    
    // Search in title or content
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { title: searchRegex },
        { content: searchRegex }
      ];
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Blog.countDocuments(query);
    
    // Execute query
    const blogs = await Blog.find(query)
      .populate('author', 'name avatar bio')
      .sort({ publishedAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    // Pagination result
    const pagination = {};
    
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }
    
    res.status(200).json({
      success: true,
      count: blogs.length,
      total,
      pagination,
      data: blogs
    });
  } catch (error) {
    console.error('Error in getBlogs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blogs',
      error: error.message
    });
  }
};

// @desc    Get single blog
// @route   GET /api/blogs/:id
// @access  Public
exports.getBlog = async (req, res) => {
  try {
    let blog;
    
    // Check if param is ID or slug
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      blog = await Blog.findById(req.params.id).populate('author', 'name avatar bio website socialLinks');
    } else {
      blog = await Blog.findOne({ slug: req.params.id }).populate('author', 'name avatar bio website socialLinks');
    }
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // If blog is not published and user is not the author or admin
    if (!blog.published) {
      if (!req.user || (req.user.id !== blog.author._id.toString() && req.user.role !== 'admin')) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found'
        });
      }
    }
    
    // Increment view count
    blog.views += 1;
    await blog.save();
    
    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Error in getBlog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog',
      error: error.message
    });
  }
};

// @desc    Create new blog
// @route   POST /api/blogs
// @access  Private
exports.createBlog = async (req, res) => {
  try {
    // Check if user is verified
    if (!req.user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your account must be verified before you can create blog posts'
      });
    }
    
    // Add user to req.body
    req.body.author = req.user.id;
    req.body.authorName = req.user.name;
    req.body.authorImage = req.user.avatar;
    
    const blog = await Blog.create(req.body);
    
    res.status(201).json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Error in createBlog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create blog',
      error: error.message
    });
  }
};

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private
exports.updateBlog = async (req, res) => {
  try {
    let blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Make sure user is blog owner or admin
    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this blog'
      });
    }
    
    // If published status is being changed to true, set publishedAt
    if (!blog.published && req.body.published === true) {
      req.body.publishedAt = Date.now();
    }
    
    blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Error in updateBlog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update blog',
      error: error.message
    });
  }
};

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Make sure user is blog owner or admin
    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this blog'
      });
    }
    
    await Blog.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error in deleteBlog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete blog',
      error: error.message
    });
  }
};

// @desc    Get blogs by user
// @route   GET /api/blogs/user
// @access  Private
exports.getUserBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user.id })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    console.error('Error in getUserBlogs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user blogs',
      error: error.message
    });
  }
};

// @desc    Like/unlike blog
// @route   PUT /api/blogs/:id/like
// @access  Private
exports.likeBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Check if the blog has already been liked by this user
    const likedIndex = blog.likedBy.indexOf(req.user.id);
    
    if (likedIndex === -1) {
      // Not liked, so add like
      blog.likes += 1;
      blog.likedBy.push(req.user.id);
      
      // Create notification for the blog author if it's not the same user
      if (blog.author.toString() !== req.user.id) {
        await createNotification({
          recipient: blog.author,
          type: 'like',
          content: `${req.user.name} liked your blog post "${blog.title}"`,
          resourceType: 'blog',
          resourceId: blog._id,
          sender: req.user.id,
          link: `/blogs/${blog._id}`
        });
      }
    } else {
      // Already liked, so remove like
      blog.likes -= 1;
      blog.likedBy.splice(likedIndex, 1);
    }
    
    await blog.save();
    
    res.status(200).json({
      success: true,
      likes: blog.likes,
      liked: likedIndex === -1 // returns true if blog was liked, false if unliked
    });
  } catch (error) {
    console.error('Error in likeBlog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like/unlike blog',
      error: error.message
    });
  }
};

// @desc    Comment on a blog
// @route   POST /api/blogs/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { comment } = req.body;
    
    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }
    
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    const newComment = {
      user: req.user.id,
      userName: req.user.name,
      userImage: req.user.avatar,
      comment
    };
    
    blog.comments.push(newComment);
    await blog.save();
    
    // Create notification for blog author if commenter is not the author
    if (blog.author.toString() !== req.user.id) {
      await createNotification({
        recipient: blog.author,
        type: 'comment',
        content: `${req.user.name} commented on your blog post "${blog.title}"`,
        resourceType: 'blog',
        resourceId: blog._id,
        sender: req.user.id,
        link: `/blogs/${blog._id}#comments`
      });
    }
    
    res.status(201).json({
      success: true,
      data: blog.comments
    });
  } catch (error) {
    console.error('Error in addComment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/blogs/:id/comments/:commentId
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Find the comment
    const comment = blog.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is authorized to delete (comment author or blog author or admin)
    if (
      comment.user.toString() !== req.user.id &&
      blog.author.toString() !== req.user.id && 
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    // Don't use comment.remove() as it's not a function in newer Mongoose
    // Instead, use the pull method on the comments array
    blog.comments.pull(req.params.commentId);
    await blog.save();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error in deleteComment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
};
