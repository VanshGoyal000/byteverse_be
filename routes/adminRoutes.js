const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    
    // Log the request details
    console.log('Admin login attempt:', { email, username: username || 'not provided' });
    
    // Validation - require either email or username
    if ((!email && !username) || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email/username and password' 
      });
    }
    
    // Create a query object that can search by email or username
    const query = {};
    if (email) query.email = email;
    if (username) query.username = username;
    
    // Check if admin exists
    const admin = await Admin.findOne(query);
    
    if (!admin) {
      console.log('Admin not found');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Check if password matches
    const isMatch = await bcrypt.compare(password, admin.password);
    
    if (!isMatch) {
      console.log('Password incorrect');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Create JWT token with a properly formatted expiresIn value
    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET || 'byteverse_secret_key',
      { expiresIn: '24h' } // Valid format for expiresIn
    );
    
    console.log('Admin login successful');
    
    // Send the token
    res.status(200).json({
      success: true,
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        name: admin.name,
        email: admin.email
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message
    });
  }
});

module.exports = router;
