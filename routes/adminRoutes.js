const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log(`Admin login attempt for username: ${username}`);
    
    // Validation
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide username and password' 
      });
    }
    
    // Check if admin exists
    const admin = await Admin.findOne({ username });
    
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
    
    // Create JWT token
    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET || 'byteverse_secret_key',
      { expiresIn: '1d' }
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
      message: 'Server error' 
    });
  }
});

module.exports = router;
