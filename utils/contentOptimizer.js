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
 * Main function to optimize blog content
 */
exports.optimizeBlogContent = (blogData) => {
  if (!blogData) return blogData;
  
  // Deep clone to avoid modifying the original
  const optimized = { ...blogData };
  
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
