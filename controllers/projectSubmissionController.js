const PendingProject = require('../models/PendingProject');
const Project = require('../models/Project');
const sendEmail = require('../utils/sendEmail');
const { notifyAdminsOfNewSubmission } = require('../middlewares/emailNotifications');
const { projectApprovalTemplate, projectRejectionTemplate } = require('../utils/emailTemplates');

// Submit a project for review
exports.submitProject = async (req, res) => {
  try {
    const {
      title,
      description,
      longDescription,
      image,
      tags,
      github,
      demo,
      technologies,
      contributors,
      submitterName,
      submitterEmail
    } = req.body;

    // Validate required fields
    if (!title || !description || !submitterName || !submitterEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Create pending project
    const pendingProject = await PendingProject.create({
      title,
      description,
      longDescription,
      image,
      tags,
      github,
      demo,
      technologies,
      contributors,
      submitterName,
      submitterEmail
    });

    // Notify admins about the new submission
    notifyAdminsOfNewSubmission(pendingProject).catch(err => {
      console.error('Failed to notify admins:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Project submitted successfully for review',
      data: pendingProject
    });
  } catch (error) {
    console.error('Error in submitProject:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing submission',
      error: error.message
    });
  }
};

// Get all pending projects (admin only)
exports.getPendingProjects = async (req, res) => {
  try {
    const pendingProjects = await PendingProject.find({ status: 'pending' })
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      count: pendingProjects.length,
      data: pendingProjects
    });
  } catch (error) {
    console.error('Error in getPendingProjects:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching pending projects',
      error: error.message
    });
  }
};

// Approve a pending project (admin only)
exports.approveProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pendingProject = await PendingProject.findById(id);
    
    if (!pendingProject) {
      return res.status(404).json({
        success: false,
        message: 'Pending project not found'
      });
    }
    
    // Convert pending project to approved project
    const approvedProject = new Project({
      title: pendingProject.title,
      description: pendingProject.description,
      longDescription: pendingProject.longDescription,
      image: pendingProject.image,
      tags: pendingProject.tags,
      github: pendingProject.github,
      demo: pendingProject.demo,
      contributors: pendingProject.contributors,
      technologies: pendingProject.technologies,
      dateCreated: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    });
    
    // Save the approved project
    await approvedProject.save();
    
    // Update the status of the pending project
    pendingProject.status = 'approved';
    await pendingProject.save();
    
    // Send notification email to the submitter using our template
    await sendEmail({
      to: pendingProject.submitterEmail,
      subject: '🎉 Your ByteVerse project has been approved!',
      html: projectApprovalTemplate(pendingProject)
    });

    res.status(200).json({
      success: true,
      message: 'Project approved successfully and submitter has been notified',
      data: approvedProject
    });
  } catch (error) {
    console.error('Error in approveProject:', error);
    res.status(500).json({
      success: false, 
      message: 'Server error approving project',
      error: error.message
    });
  }
};

// Reject a pending project (admin only)
exports.rejectProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminFeedback } = req.body;
    
    const pendingProject = await PendingProject.findById(id);
    
    if (!pendingProject) {
      return res.status(404).json({
        success: false,
        message: 'Pending project not found'
      });
    }
    
    // Update the pending project
    pendingProject.status = 'rejected';
    pendingProject.adminFeedback = adminFeedback || 'Project did not meet our guidelines';
    await pendingProject.save();
    
    // Send rejection email to the submitter with feedback using our template
    await sendEmail({
      to: pendingProject.submitterEmail,
      subject: 'Update on your ByteVerse project submission',
      html: projectRejectionTemplate(pendingProject)
    });

    res.status(200).json({
      success: true,
      message: 'Project rejected successfully and submitter has been notified',
      data: pendingProject
    });
  } catch (error) {
    console.error('Error in rejectProject:', error);
    res.status(500).json({
      success: false,
      message: 'Server error rejecting project',
      error: error.message
    });
  }
};

// Get project submission statistics
exports.getProjectStatistics = async (req, res) => {
  try {
    const pending = await PendingProject.countDocuments({ status: 'pending' });
    const approved = await PendingProject.countDocuments({ status: 'approved' });
    const rejected = await PendingProject.countDocuments({ status: 'rejected' });
    
    res.status(200).json({
      success: true,
      data: {
        pending,
        approved,
        rejected
      }
    });
  } catch (error) {
    console.error('Error in getProjectStatistics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics',
      error: error.message
    });
  }
};
