/**
 * Content optimization utility for large text and image content
 */

/**
 * Optimize HTML content by removing unnecessary whitespace and comments
 */
exports.optimizeHtml = (html) => {
  if (!html) return '';
  
  // Remove HTML comments
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  
  // Remove excessive whitespace (but preserve necessary spaces)
  html = html.replace(/\s{2,}/g, ' ');
  
  return html.trim();
};

/**
 * Process image data URLs to reduce their size
 * This function can be expanded to actually resize/compress images
 */
exports.processImageUrls = (content) => {
  if (typeof content !== 'string') return content;
  
  // Simple check to warn about large images
  const imgDataUrlRegex = /data:image\/[^;]+;base64,([^"')\s]+)/gi;
  let match;
  let largeImages = 0;
  
  // Find all image data URLs and check their sizes
  while ((match = imgDataUrlRegex.exec(content)) !== null) {
    const base64Data = match[1];
    // Estimate size: base64 string length * 0.75 gives approximate byte size
    const approximateByteSize = base64Data.length * 0.75;
    
    if (approximateByteSize > 500000) { // 500KB
      largeImages++;
      console.warn(`Large image detected in content (approx ${Math.round(approximateByteSize/1024)}KB)`);
    }
  }
  
  if (largeImages > 0) {
    console.warn(`Content contains ${largeImages} large images. Consider external storage.`);
  }
  
  return content;
};

/**
 * Create a truncated excerpt from HTML content
 */
exports.createExcerpt = (htmlContent, maxLength = 150) => {
  if (!htmlContent) return '';
  
  // Remove HTML tags
  const textContent = htmlContent.replace(/<[^>]*>/g, ' ');
  
  // Remove excessive spaces
  const cleanedText = textContent.replace(/\s+/g, ' ').trim();
  
  // Truncate to maxLength
  if (cleanedText.length <= maxLength) {
    return cleanedText;
  }
  
  // Find a good break point
  const truncated = cleanedText.substr(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return truncated.substr(0, lastSpace) + '...';
  }
  
  return truncated + '...';
};

/**
 * Optimize blog list items to reduce payload size
 * This creates lightweight versions of blogs for listing pages
 */
exports.optimizeBlogList = (blogs) => {
  if (!blogs || !Array.isArray(blogs)) return blogs;
  
  return blogs.map(blog => {
    // Create a lightweight version for listing
    const optimized = {
      _id: blog._id,
      title: blog.title,
      excerpt: blog.excerpt || exports.createExcerpt(blog.content),
      categories: blog.categories,
      tags: blog.tags,
      featured: blog.featured,
      authorName: blog.authorName || 'Anonymous',
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt
    };
    
    // Include a small version of cover image or just the URL
    if (blog.coverImage) {
      // If it's a data URL, we could create a thumbnail version
      // For now, we'll just pass the URL as is
      optimized.coverImage = blog.coverImage;
    }
    
    return optimized;
  });
};

/**
 * Main function to optimize blog content
 */
exports.optimizeBlogContent = (blogData) => {
  if (!blogData) return blogData;
  
  // Deep clone to avoid modifying the original
  const optimized = { ...blogData };
  
  // Preserve author information
  if (!optimized.authorName) {
    optimized.authorName = 'Anonymous'; // Default author name if none provided
  }
  
  // Optimize the main HTML content
  if (optimized.content) {
    optimized.content = exports.optimizeHtml(optimized.content);
    optimized.content = exports.processImageUrls(optimized.content);
  }
  
  // Handle cover image if it's a data URL
  if (optimized.coverImage && typeof optimized.coverImage === 'string' && 
      optimized.coverImage.startsWith('data:image')) {
    exports.processImageUrls(optimized.coverImage);
    
    // If the cover image is very large, log a warning
    if (optimized.coverImage.length > 500000) {
      console.warn('Large cover image detected. Consider using external image hosting.');
    }
  }
  
  return optimized;
};
