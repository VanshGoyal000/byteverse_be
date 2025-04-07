const axios = require('axios');
const { URL } = require('url');

/**
 * Validate image URL existence and accessibility
 * @param {string} url - The image URL to validate
 * @returns {Promise<boolean>} - Whether the image exists and is accessible
 */
exports.validateImageUrl = async (url) => {
  try {
    // Check if it's a data URL (base64)
    if (url.startsWith('data:image/')) {
      return true; // Data URLs are always valid as they contain the image data
    }
    
    // Only validate HTTP(S) URLs
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return false;
    }
    
    // Parse the URL to ensure it's valid
    const parsedUrl = new URL(url);
    
    // Set a timeout to avoid long-running requests
    const response = await axios.head(url, {
      timeout: 5000, // 5 seconds timeout
      validateStatus: status => status < 400 // Accept any status less than 400
    });
    
    // Check for content type to ensure it's an image
    const contentType = response.headers['content-type'];
    return contentType && contentType.startsWith('image/');
  } catch (error) {
    console.warn(`Image validation failed for ${url}: ${error.message}`);
    return false;
  }
};

/**
 * Extract all image URLs from blog content
 * @param {string} content - HTML content of the blog
 * @returns {string[]} - Array of image URLs found in content
 */
exports.extractImageUrls = (content) => {
  if (!content || typeof content !== 'string') return [];
  
  const imageUrls = [];
  
  // Extract URLs from <img> tags
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  
  while ((match = imgRegex.exec(content)) !== null) {
    if (match[1]) {
      imageUrls.push(match[1]);
    }
  }
  
  // Extract URLs from background-image CSS
  const bgImageRegex = /background-image:\s*url\(['"]?([^'"\)]+)['"]?\)/gi;
  
  while ((match = bgImageRegex.exec(content)) !== null) {
    if (match[1]) {
      imageUrls.push(match[1]);
    }
  }
  
  return imageUrls;
};

/**
 * Validate all images in the blog content
 * @param {Object} blogData - Blog data including content and coverImage
 * @returns {Promise<Object>} - Blog data with validation results
 */
exports.validateBlogImages = async (blogData) => {
  if (!blogData) return blogData;
  
  const imageStatus = {};
  const validationPromises = [];
  
  // First check cover image if exists
  if (blogData.coverImage && !blogData.coverImage.startsWith('data:image/')) {
    validationPromises.push(
      exports.validateImageUrl(blogData.coverImage)
        .then(isValid => {
          imageStatus.coverImage = isValid;
        })
    );
  }
  
  // Then extract and check content images
  if (blogData.content) {
    const contentImages = exports.extractImageUrls(blogData.content);
    
    // Limit validation to 20 images to prevent abuse
    const imagesToCheck = contentImages.slice(0, 20);
    
    for (let i = 0; i < imagesToCheck.length; i++) {
      const imageUrl = imagesToCheck[i];
      validationPromises.push(
        exports.validateImageUrl(imageUrl)
          .then(isValid => {
            imageStatus[`content_${i}`] = {
              url: imageUrl,
              valid: isValid
            };
          })
      );
    }
  }
  
  // Wait for all validation promises to complete
  await Promise.all(validationPromises);
  
  // Add validation results to blog data
  return {
    ...blogData,
    imageStatus
  };
};

/**
 * Sanitize blog content by removing invalid images
 * @param {string} content - HTML content to sanitize
 * @param {Object} imageStatus - Validation results from validateBlogImages
 * @returns {string} - Sanitized HTML content
 */
exports.sanitizeBlogContent = (content, imageStatus) => {
  if (!content || !imageStatus) return content;
  
  let sanitizedContent = content;
  
  // Find all content images with validation status
  Object.entries(imageStatus)
    .filter(([key, status]) => key.startsWith('content_') && !status.valid)
    .forEach(([_, status]) => {
      const imageUrl = status.url;
      if (!imageUrl) return;
      
      // Replace img tags with invalid src with placeholder
      const imgTagRegex = new RegExp(`<img[^>]+src=["']${escapeRegExp(imageUrl)}["'][^>]*>`, 'gi');
      sanitizedContent = sanitizedContent.replace(imgTagRegex, '<img src="/images/placeholder.jpg" alt="Image not available" class="placeholder-image">');
      
      // Replace background-image with invalid URL with fallback
      const bgImageRegex = new RegExp(`background-image:\\s*url\\(['"]?${escapeRegExp(imageUrl)}['"]?\\)`, 'gi');
      sanitizedContent = sanitizedContent.replace(bgImageRegex, 'background-color: #f0f0f0');
    });
  
  return sanitizedContent;
};

// Helper function to escape special characters in regex
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
