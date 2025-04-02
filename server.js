const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Server setup
const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://byteverse.tech', 'https://www.byteverse.tech'] 
    : 'http://localhost:5173', // Vite's default dev server port
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());

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

// Mount routers
app.use('/api/auth', auth);
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
