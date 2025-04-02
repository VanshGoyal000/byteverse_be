const Registration = require('../models/Registration');
const Event = require('../models/Event');
const sendEmail = require('../utils/sendEmail');
const { eventRegistrationTemplate } = require('../utils/emailTemplates');

// Register for an event
exports.registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, email, phone, github, linkedin } = req.body;
    
    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and email are required fields' 
      });
    }
    
    // Check if event exists - try both ObjectId and String match
    let event;
    try {
      event = await Event.findById(eventId);
    } catch (e) {
      // If ID format is invalid, try finding by numeric ID if possible
      event = await Event.findOne({ id: parseInt(eventId) });
    }
    
    if (!event) {
      // For development, allow registration even if event doesn't exist in DB
      console.log('Warning: Event not found in database, but continuing with registration');
    }
    
    // Check if user already registered
    const existingRegistration = await Registration.findOne({ eventId, email });
    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You have already registered for this event'
      });
    }
    
    // Generate a unique ticket ID
    const ticketId = `BV-${eventId}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    // Create new registration with ticket ID
    const registration = new Registration({
      eventId,
      name,
      email,
      phone,
      github,
      linkedin,
      ticketId // Save the ticket ID in the database
    });
    
    await registration.save();
    
    // Send confirmation email with event ticket
    try {
      await sendEmail({
        to: email,
        subject: `Your Registration Confirmation for ${event?.title || 'ByteVerse Event'}`,
        html: eventRegistrationTemplate(registration, event || { 
          id: eventId,
          title: 'ByteVerse Event', 
          date: 'TBA',
          time: 'TBA',
          location: 'TBA'
        })
      });
      console.log(`Registration confirmation email sent to ${email}`);
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Continue with registration even if email fails
    }
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'Registration successful. Check your email for confirmation.',
      data: registration
    });
    
  } catch (error) {
    console.error('Error in registerForEvent:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing registration',
      error: error.message
    });
  }
};

// Get all registrations for an event (admin only)
exports.getRegistrationsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Verify admin permissions here (middleware would be better)
    
    const registrations = await Registration.find({ eventId });
    
    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
    
  } catch (error) {
    console.error('Error in getRegistrationsByEvent:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching registrations',
      error: error.message
    });
  }
};

// Check registration status
exports.checkRegistrationStatus = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }
    
    const registration = await Registration.findOne({ eventId, email });
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        status: registration.status,
        registeredAt: registration.registeredAt
      }
    });
    
  } catch (error) {
    console.error('Error in checkRegistrationStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking registration',
      error: error.message
    });
  }
};

// Resend confirmation email with ticket
exports.resendConfirmation = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Find registration
    const registration = await Registration.findOne({ eventId, email });
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }
    
    // Get event details
    let event;
    try {
      event = await Event.findById(eventId);
    } catch (e) {
      event = await Event.findOne({ id: parseInt(eventId) });
    }
    
    // Send confirmation email again
    await sendEmail({
      to: email,
      subject: `Your Registration Confirmation for ${event?.title || 'ByteVerse Event'}`,
      html: eventRegistrationTemplate(registration, event || { 
        id: eventId,
        title: 'ByteVerse Event', 
        date: 'TBA',
        time: 'TBA',
        location: 'TBA'
      })
    });
    
    res.status(200).json({
      success: true,
      message: 'Confirmation email sent successfully'
    });
    
  } catch (error) {
    console.error('Error in resendConfirmation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sending confirmation',
      error: error.message
    });
  }
};

// Send group links to all event registrants
exports.sendGroupLinksToRegistrants = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { groupLink, message, subject } = req.body;
    
    // Validate required fields
    if (!groupLink || !subject) {
      return res.status(400).json({ 
        success: false, 
        message: 'Group link and subject are required'
      });
    }
    
    // Get the event details
    let event;
    try {
      event = await Event.findById(eventId);
      if (!event) {
        event = await Event.findOne({ id: parseInt(eventId) });
      }
    } catch (e) {
      console.error('Error finding event:', e);
    }
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Find all registrations for this event
    const registrations = await Registration.find({ 
      eventId, 
      status: { $ne: 'cancelled' }  // Exclude cancelled registrations
    });
    
    if (registrations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No registrations found for this event'
      });
    }
    
    // Send group link email to all registrants
    const emailPromises = registrations.map(registration => {
      return sendEmail({
        to: registration.email,
        subject: subject || `Important Information for ${event.title}`,
        html: eventGroupLinkTemplate(registration, event, groupLink, message)
      });
    });
    
    await Promise.all(emailPromises);
    
    res.status(200).json({
      success: true,
      message: `Group link sent to ${registrations.length} registrants`,
      count: registrations.length
    });
    
  } catch (error) {
    console.error('Error in sendGroupLinksToRegistrants:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sending group links',
      error: error.message
    });
  }
};

// Add or update the check registration endpoint
exports.checkRegistration = async (req, res) => {
  try {
    const { email } = req.body;
    const { eventId } = req.params;
    
    if (!email || !eventId) {
      return res.status(400).json({
        success: false,
        message: 'Email and event ID are required'
      });
    }

    // Check if registration exists
    const registration = await Registration.findOne({ 
      event: eventId,
      email: email.toLowerCase()
    });

    return res.status(200).json({
      success: true,
      registered: !!registration
    });
  } catch (error) {
    console.error('Error checking registration:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking registration status',
      error: error.message
    });
  }
};

// Update the register endpoint to associate with user if authenticated
exports.register = async (req, res) => {
  try {
    const { email, name, phone } = req.body;
    const { eventId } = req.params;
    
    // Check if the event exists and has spots available
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check if registration already exists
    const existingRegistration = await Registration.findOne({
      event: eventId,
      email: email.toLowerCase()
    });
    
    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }
    
    // Create registration object
    const registrationData = {
      event: eventId,
      email: email.toLowerCase(),
      name,
      phone
    };
    
    // If user is authenticated, associate registration with their account
    if (req.user) {
      registrationData.user = req.user.id;
    }
    
    // Create the registration
    const registration = await Registration.create(registrationData);
    
    // Update event registration count
    event.registeredCount = (event.registeredCount || 0) + 1;
    await event.save();
    
    // Send confirmation email
    try {
      // Email logic...
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
    }
    
    res.status(201).json({
      success: true,
      data: registration
    });
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering for event',
      error: error.message
    });
  }
};

// @desc    Get user's event registrations
// @route   GET /api/registrations/user
// @access  Private
exports.getUserRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ user: req.user.id })
      .populate('event', 'title date image location');
    
    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    console.error('Error in getUserRegistrations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching registrations',
      error: error.message
    });
  }
};

// @desc    Get all registrations for an event
// @route   GET /api/registrations/events/:eventId
// @access  Private (Admin only)
exports.getEventRegistrations = async (req, res) => {
  try {
    // Check if the user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access registrations'
      });
    }

    const { eventId } = req.params;
    
    const registrations = await Registration.find({ event: eventId })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    console.error('Error in getEventRegistrations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching event registrations',
      error: error.message
    });
  }
};
