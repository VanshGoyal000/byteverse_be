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
const corsOptions = {= [
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://byteverse.tech', 'https://www.byteverse.tech'] 
    : 'http://localhost:5173', // Vite's default dev server port
  credentials: true,omains that need access to your API
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};origin: function (origin, callback) {
app.use(cors(corsOptions));no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
// Security: Body parser with size limits
app.use(express.json({ limit: '10kb' })); // Limit body size to 10kbV !== 'production') {
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
    } else {
// Security: Data sanitization against NoSQL query injectionin}`);
app.use(mongoSanitize());'Not allowed by CORS'));
    }
// Security: Data sanitization against XSS
app.use(xss());true,
  optionsSuccessStatus: 200,
// Security: Prevent parameter pollutionE', 'OPTIONS', 'PATCH'],
app.use(hpp({ers: ['Content-Type', 'Authorization', 'X-Requested-With']
  whitelist: [
    'title', 'category', 'tags', 'date', 'featured', 'status', 'author'
  ].use(cors(corsOptions));
}));
// Handle OPTIONS preflight requests explicitly
// Security: Implement trusted proxy
app.set('trust proxy', 1);
// Security: Body parser with size limits
// Import security middleware{ limit: '10kb' })); // Limit body size to 10kb
const securityMiddleware = require('./middleware/security');ue, limit: '10kb' }));

// Apply security middlewaretion against NoSQL query injection
app.use(securityMiddleware.blocklistCheck);p.use(mongoSanitize());
app.use(securityMiddleware.suspiciousActivityMonitor);
app.use(securityMiddleware.enhancedCors); // Apply enhanced CORS handling
app.use(xss());
// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {on
  useNewUrlParser: true,
  useUnifiedTopology: true
})ured', 'status', 'author'
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Route files
const auth = require('./routes/auth');
const blogs = require('./routes/blogs');
const events = require('./routes/events');
const projects = require('./routes/projects');v.MONGO_URI, {
const registrations = require('./routes/registration');
const projectSubmissions = require('./routes/projectSubmissions');
const admin = require('./routes/admin');
const community = require('./routes/community');
const notifications = require('./routes/notifications'); err));

// Mount routers - remove the duplicated routes
app.use('/api/auth', auth);
app.use('/api/blogs', blogs);const blogs = require('./routes/blogs');
app.use('/api/events', events);equire('./routes/events');
app.use('/api/projects', projects);routes/projects');
app.use('/api/registrations', registrations);/registration');
app.use('/api/project-submissions', projectSubmissions);st projectSubmissions = require('./routes/projectSubmissions');
app.use('/api/admin', admin);const admin = require('./routes/admin');
app.use('/api/community', community);outes/community');
app.use('/api/notifications', notifications);e('./routes/notifications');

// Default routeremove the duplicated routes
app.get('/', (req, res) => {
  res.send('ByteVerse API is running');se('/api/blogs', blogs);
});.use('/api/events', events);
app.use('/api/projects', projects);
// Security: Add a 404 handler
app.use('*', (req, res) => {, projectSubmissions);
  res.status(404).json({
    success: false,p.use('/api/community', community);
    message: 'API endpoint not found'
  });
});
s) => {
// Security: Improved error handling middleware
app.use((err, req, res, next) => {
  console.error(`Error [${req.method} ${req.url}]:`, err);
   Security: Add a 404 handler
  // Check if the error was caused by rate limiting{
  if (err.status === 429) {
    return res.status(429).json({
      success: false,ndpoint not found'
      message: 'Rate limit exceeded. Please try again later.'
    });
  }
  Security: Improved error handling middleware
  // Default error responseapp.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;r);
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Something went wrong on the server',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });  success: false,
});

// Add global error handler for route definition errors
process.on('uncaughtException', (err) => {
  if (err.message.includes('requires a callback function but got a [object Undefined]')) {lt error response
    console.error('\x1b[31m%s\x1b[0m', 'ERROR: Route handler is undefined. Check your controller exports.');
    console.error('\x1b[33m%s\x1b[0m', err.stack);
    
    // In production, we might want to keep the server running despite this errorsage || 'Something went wrong on the server',
    if (process.env.NODE_ENV === 'development') { stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
      process.exit(1););
    }});
  } else {
    // For other uncaught exceptions, follow normal termination procedureition errors
    console.error('\x1b[31m%s\x1b[0m', 'UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error('\x1b[33m%s\x1b[0m', err.stack);function but got a [object Undefined]')) {
    process.exit(1);  console.error('\x1b[31m%s\x1b[0m', 'ERROR: Route handler is undefined. Check your controller exports.');
  }
});
 error
// Security: Handle promise rejections
process.on('unhandledRejection', (err) => {
  console.error('\x1b[31m%s\x1b[0m', 'UNHANDLED REJECTION! 💥');
  console.error('\x1b[33m%s\x1b[0m', err.stack);e {
   // For other uncaught exceptions, follow normal termination procedure
  // In production, we might want to gracefully shut down console.error('\x1b[31m%s\x1b[0m', 'UNCAUGHT EXCEPTION! 💥 Shutting down...');
  if (process.env.NODE_ENV === 'production') {    console.error('\x1b[33m%s\x1b[0m', err.stack);
    // Give the server time to finish current requests before shutting down
    console.log('Server closing due to unhandled promise rejection...');
    server.close(() => {});
      process.exit(1);
    });// Security: Handle promise rejections
  }dRejection', (err) => {
});1b[0m', 'UNHANDLED REJECTION! 💥');

// Create HTTP server
const server = createServer(app);acefully shut down
 {
server.listen(PORT, () => console.log(`Server running on port ${PORT}`)); time to finish current requests before shutting down
sole.log('Server closing due to unhandled promise rejection...');
// Graceful shutdownerver.close(() => {
process.on('SIGTERM', () => {   process.exit(1);
  console.log('SIGTERM signal received. Shutting down gracefully...');    });








});  });    });      process.exit(0);    mongoose.connection.close(false, () => {    console.log('Process terminated!');  server.close(() => {  }
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
