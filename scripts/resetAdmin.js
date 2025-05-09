const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

// Load env vars
dotenv.config();

// Get MongoDB connection string from environment variables
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/byteverse';

// New admin credentials - CUSTOMIZE THESE
const NEW_ADMIN = {
  username: 'admin',
  password: 'admin123', // Simple password for development only!
  name: 'Admin User',
  email: 'vanshgoyal9528@gmail.com'
};

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB Connected');
  
  try {
    // Step 1: Remove all existing admins
    console.log('Removing existing admin accounts...');
    const deleteResult = await Admin.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} admin accounts`);
    
    // Step 2: Hash the new simple password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(NEW_ADMIN.password, salt);
    
    // Step 3: Create new admin with simple password
    const admin = new Admin({
      username: NEW_ADMIN.username,
      password: hashedPassword,
      name: NEW_ADMIN.name,
      email: NEW_ADMIN.email
    });
    
    await admin.save();
    
    console.log('----------------------------------------');
    console.log('✅ New admin created successfully!');
    console.log('----------------------------------------');
    console.log(`Username: ${NEW_ADMIN.username}`);
    console.log(`Password: ${NEW_ADMIN.password}`);
    console.log('----------------------------------------');
    console.log('IMPORTANT: For production, please change to a more secure password.');
    console.log('----------------------------------------');
    
    // Exit process
    process.exit(0);
  } catch (error) {
    console.error('Error during admin reset:', error);
    process.exit(1);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
