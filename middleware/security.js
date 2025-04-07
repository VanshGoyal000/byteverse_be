/**
 * Enhanced security middleware for the ByteVerse API
 */

const ipBlocklist = new Set(); // In-memory blocklist - in production use Redis/DB
const suspiciousActivities = new Map(); // Track suspicious IPs

/**
 * Check if an IP is in the blocklist
 */
exports.blocklistCheck = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  // If IP is in blocklist, return 403
  if (ipBlocklist.has(ip)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  
  next();
};

/**
 * Monitor for suspicious activity
 */
exports.suspiciousActivityMonitor = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  // Skip monitoring for trusted IPs (localhost during dev)
  if (ip === '127.0.0.1' || ip === '::1') {
    return next();
  }
  
  // Initialize or update tracking for this IP
  if (!suspiciousActivities.has(ip)) {
    suspiciousActivities.set(ip, {
      count: 1,
      firstSeen: now,
      lastSeen: now,
      endpoints: new Set([req.path])
    });
  } else {
    const record = suspiciousActivities.get(ip);
    record.count++;
    record.lastSeen = now;
    record.endpoints.add(req.path);
    
    // Detect rapid sequential requests (potential scanning)
    const timeWindow = now - record.firstSeen;
    if (record.count > 50 && timeWindow < 10000) { // 50+ requests in 10 seconds
      console.warn(`Suspicious activity detected from IP ${ip}. Blocking.`);
      ipBlocklist.add(ip);
      return res.status(403).json({
        success: false,
        message: 'Suspicious activity detected'
      });
    }
    
    // Detect endpoint scanning (hitting many different endpoints quickly)
    if (record.endpoints.size > 20 && timeWindow < 30000) { // 20+ unique endpoints in 30 seconds
      console.warn(`Endpoint scanning detected from IP ${ip}. Blocking.`);
      ipBlocklist.add(ip);
      return res.status(403).json({
        success: false,
        message: 'Suspicious activity detected'
      });
    }
  }
  
  // Cleanup old records every 10 minutes
  if (now % 600000 < 1000) { // Approximately every 10 minutes
    const cutoff = now - 3600000; // 1 hour ago
    for (const [ip, record] of suspiciousActivities.entries()) {
      if (record.lastSeen < cutoff) {
        suspiciousActivities.delete(ip);
      }
    }
  }
  
  next();
};

/**
 * Prevent common web vulnerabilities
 */
exports.securityHeaders = (req, res, next) => {
  // Set content security policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;"
  );
  
  // Set X-Content-Type-Options header
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Set X-Frame-Options header
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Set Strict-Transport-Security header
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  next();
};

/**
 * Enhance CORS handling for problematic clients
 */
exports.enhancedCors = (req, res, next) => {
  const origin = req.headers.origin;
  
  // Set CORS headers for all responses
  const allowedOrigins = [
    'http://localhost:5173',
    'https://byteverse.tech',
    'https://www.byteverse.tech'
  ];
  
  if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production')) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  // Handle preflight OPTIONS requests explicitly
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
};

/**
 * Request validation middleware
 */
exports.validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      if (schema.body) {
        const { error } = schema.body.validate(req.body);
        if (error) {
          return res.status(400).json({
            success: false,
            message: `Invalid request body: ${error.details[0].message}`
          });
        }
      }
      
      if (schema.query) {
        const { error } = schema.query.validate(req.query);
        if (error) {
          return res.status(400).json({
            success: false,
            message: `Invalid query parameters: ${error.details[0].message}`
          });
        }
      }
      
      if (schema.params) {
        const { error } = schema.params.validate(req.params);
        if (error) {
          return res.status(400).json({
            success: false,
            message: `Invalid path parameters: ${error.details[0].message}`
          });
        }
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Content size checker middleware - More flexible limits based on content type
 */
exports.contentSizeChecker = (req, res, next) => {
  // Skip size checks for GET requests
  if (req.method === 'GET') {
    return next();
  }
  
  // Skip size checks for certain endpoints that need to handle larger payloads
  const largeContentEndpoints = [
    '/api/blogs',
    '/api/project-submissions'
  ];
  
  // Check if this is one of our large content endpoints
  const isLargeContentEndpoint = largeContentEndpoints.some(endpoint => 
    req.path.startsWith(endpoint)
  );
  
  // For blog-related endpoints, we already set a custom middleware with higher limits,
  // so we can skip additional checks
  if (isLargeContentEndpoint) {
    return next();
  }
  
  // Get content length from headers
  const contentLength = parseInt(req.headers['content-length'] || 0, 10);
  
  if (contentLength > 0) {
    // For most endpoints, enforce a 1mb limit
    if (!isLargeContentEndpoint && contentLength > 1 * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        message: 'Payload too large for this endpoint - max size is 1MB'
      });
    }
    
    // For large content endpoints, this shouldn't execute due to the skip above,
    // but just in case
    if (isLargeContentEndpoint && contentLength > 10 * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        message: 'Payload too large - max size is 10MB'
      });
    }
  }
  
  next();
};
