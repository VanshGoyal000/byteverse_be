const CommunityMember = require('../models/CommunityMember');
const sendEmail = require('../utils/sendEmail');
const { communityWelcomeTemplate } = require('../utils/emailTemplates');

// WhatsApp group link - consider storing this in .env
const WHATSAPP_GROUP_LINK = process.env.WHATSAPP_GROUP_LINK || 'https://chat.whatsapp.com/your-group-invite-link';

// Join community
exports.joinCommunity = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    
    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email and phone are required fields' 
      });
    }
    
    // Check if user already exists
    const existingMember = await CommunityMember.findOne({ email });
    
    if (existingMember) {
      // If member exists but is inactive, reactivate them
      if (!existingMember.isActive) {
        existingMember.isActive = true;
        await existingMember.save();
        
        // Send welcome back email
        await sendEmail({
          to: email,
          subject: 'Welcome Back to ByteVerse Community!',
          html: communityWelcomeTemplate(existingMember, WHATSAPP_GROUP_LINK)
        });
        
        return res.status(200).json({
          success: true,
          message: 'Welcome back to the community!',
          data: existingMember
        });
      }
      
      // If active member, return error
      return res.status(400).json({
        success: false,
        message: 'You are already a member of our community. Check your email for details.'
      });
    }
    
    // Create new member
    const member = new CommunityMember({
      name,
      email,
      phone,
    });
    
    await member.save();
    
    // Send welcome email with WhatsApp link
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to ByteVerse Community! 🚀',
        html: communityWelcomeTemplate(member, WHATSAPP_GROUP_LINK)
      });
      console.log(`Welcome email sent to ${email}`);
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Continue even if email fails
    }
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'You have successfully joined the ByteVerse community! Check your email for details.',
      data: member
    });
    
  } catch (error) {
    console.error('Error in joinCommunity:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing your request',
      error: error.message
    });
  }
};

// Get community members (admin only)
exports.getCommunityMembers = async (req, res) => {
  try {
    const members = await CommunityMember.find({ isActive: true })
      .sort({ joinedAt: -1 });
    
    res.status(200).json({
      success: true,
      count: members.length,
      data: members
    });
    
  } catch (error) {
    console.error('Error in getCommunityMembers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching community members',
      error: error.message
    });
  }
};
