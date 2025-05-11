// @desc    Login admin
// @route   POST /api/admin/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const loginIdentifier = username || email;

    // Validate credentials are provided
    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username/email and password'
      });
    }

    // Check for admin by either username or email
    const admin = await Admin.findOne({
      $or: [
        { username: loginIdentifier },
        { email: loginIdentifier }
      ]
    }).select('+password');

    if (!admin) {
      console.log(`No admin found for identifier: ${loginIdentifier}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      console.log(`Password mismatch for admin: ${loginIdentifier}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create token
    const token = jwt.sign(
      { id: admin._id },
      process.env.ADMIN_JWT_SECRET || 'adminbyteversesecret12345',
      { expiresIn: '1d' }
    );

    res.status(200).json({
      success: true,
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        username: admin.username,
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
};