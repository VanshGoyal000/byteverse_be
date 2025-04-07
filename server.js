const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const { createServer } = require('http');

// Load env vars
dotenv.config();

// Server setup
const app = express();
const PORT = process.env.PORT || 5000;

// Security: Set security headers
app.use(helmet());

// Security: Rate limiting to prevent DDOS attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api/', limiter); // Apply to all API requests

// Security: Add more aggressive rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: 'Too many login attempts, please try again after an hour'
});
app.use('/api/auth/login', authLimiter);
app.use('/api/admin/login', authLimiter);

// Security: CORS configuration - Updated to handle production domain correctly
const allowedOrigins = [
  'http://localhost:5173',  // Dev server
  'https://byteverse.tech',
  'https://www.byteverse.tech',
  // Add any other domains that need access to your API
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Handle OPTIONS preflight requests explicitly
app.options('*', cors(corsOptions));

// Security: Body parser with size limits - Increased for blog content
app.use(express.json({ limit: '10kb' })); // Limit body size to 10kbmb
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Security: Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Security: Data sanitization against XSS
app.use(xss());

// Security: Prevent parameter pollution
app.use(hpp({
  whitelist: [
    'title', 'category', 'tags', 'date', 'featured', 'status', 'author'
  ]
}));

// Security: Implement trusted proxy
app.set('trust proxy', 1);

// Import security middleware
const securityMiddleware = require('./middleware/security');

// Apply security middleware
app.use(securityMiddleware.blocklistCheck);
app.use(securityMiddleware.suspiciousActivityMonitor);
app.use(securityMiddleware.contentSizeChecker); // Add content size checker
app.use(securityMiddleware.enhancedCors); // Apply enhanced CORS handling

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Route files
const auth = require('./routes/auth');
const blogs = require('./routes/blogs');
const events = require('./routes/events');
const projects = require('./routes/projects');
const registrations = require('./routes/registration');
const projectSubmissions = require('./routes/projectSubmissions');
const admin = require('./routes/admin');
const community = require('./routes/community');
const notifications = require('./routes/notifications');
 with specific middleware for blogs to handle larger payloads
// Mount routers
app.use('/api/auth', auth);.json({ limit: '10mb' }), blogs); // Special larger limit for blogs
app.use('/api/blogs', blogs);
app.use('/api/events', events);
app.use('/api/projects', projects);
app.use('/api/registrations', registrations);
app.use('/api/project-submissions', projectSubmissions);
app.use('/api/admin', admin);
app.use('/api/community', community);
app.use('/api/notifications', notifications);

// Default route
app.get('/', (req, res) => {
  res.send('ByteVerse API is running');
});

// Security: Add a 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Security: Improved error handling middleware
app.use((err, req, res, next) => {
  console.error(`Error [${req.method} ${req.url}]:`, err);
  
  // Check if the error was caused by rate limiting
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Please try again later.'
    });
  }
  
  // Default error response
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Something went wrong on the server',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
});

// Add global error handler for route definition errors
process.on('uncaughtException', (err) => {
  if (err.message.includes('requires a callback function but got a [object Undefined]')) {
    console.error('\x1b[31m%s\x1b[0m', 'ERROR: Route handler is undefined. Check your controller exports.');
    console.error('\x1b[33m%s\x1b[0m', err.stack);
    
    // In production, we might want to keep the server running despite this error
    if (process.env.NODE_ENV === 'development') {
      process.exit(1);
    }
  } else {
    // For other uncaught exceptions, follow normal termination procedure
    console.error('\x1b[31m%s\x1b[0m', 'UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error('\x1b[33m%s\x1b[0m', err.stack);
    process.exit(1);
  }
});

// Security: Handle promise rejections
process.on('unhandledRejection', (err) => {
  console.error('\x1b[31m%s\x1b[0m', 'UNHANDLED REJECTION! 💥');
  console.error('\x1b[33m%s\x1b[0m', err.stack);
  
  // In production, we might want to gracefully shut down
  if (process.env.NODE_ENV === 'production') {
    // Give the server time to finish current requests before shutting down
    console.log('Server closing due to unhandled promise rejection...');
    server.close(() => {
      process.exit(1);
    });
  }
});

// Create HTTP server
const server = createServer(app);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated!');
    mongoose.connection.close(false, () => {
      process.exit(0);
    });
  });
});
