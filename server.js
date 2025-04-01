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

// Routes
app.use('/api/projects', require('./routes/projects'));
app.use('/api/events', require('./routes/events'));
app.use('/api/registrations', require('./routes/registration'));
app.use('/api/project-submissions', require('./routes/projectSubmissions'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/community', require('./routes/community')); // Add this line
app.use('/api/auth', require('./routes/auth'));

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
