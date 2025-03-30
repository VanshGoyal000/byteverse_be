const sendEmail = require('../utils/sendEmail');

/**
 * Middleware to notify admins about new project submissions
 */
exports.notifyAdminsOfNewSubmission = async (project) => {
  try {
    const adminEmails = process.env.ADMIN_EMAILS ? 
      process.env.ADMIN_EMAILS.split(',') : 
      ['admin@byteverse.dev'];
    
    for (const email of adminEmails) {
      await sendEmail({
        to: email.trim(),
        subject: '📝 New ByteVerse Project Submission',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(to right, #6e9ef5, #8A2BE2); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f8f9fa; border: 1px solid #e1e1e8; border-top: none; padding: 20px; border-radius: 0 0 8px 8px; }
                .project-info { background: white; border-left: 4px solid #6e9ef5; padding: 15px; margin: 15px 0; }
                .button { display: inline-block; background: linear-gradient(to right, #6e9ef5, #8A2BE2); color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">New Project Submission</h1>
                </div>
                <div class="content">
                  <p>A new project has been submitted to ByteVerse and is awaiting review.</p>
                  
                  <div class="project-info">
                    <h2 style="margin-top: 0;">${project.title}</h2>
                    <p><strong>Submitted by:</strong> ${project.submitterName} (${project.submitterEmail})</p>
                    <p><strong>Description:</strong> ${project.description}</p>
                    <p><strong>Submission Date:</strong> ${new Date(project.submittedAt).toLocaleString()}</p>
                  </div>
                  
                  <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.ADMIN_URL || 'http://localhost:5173/admin/dashboard'}" class="button">Review Project</a>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `
      });
    }
    console.log('Admin notification emails sent successfully');
  } catch (error) {
    console.error('Failed to send admin notification:', error);
    // We don't throw here since we don't want to disrupt the main process
  }
};

/**
 * Middleware to send event registration confirmation
 */
exports.sendEventConfirmation = async (registration, event) => {
  // Implementation will use eventRegistrationTemplate from emailTemplates.js
  // This is already handled in the registrationController.js
};
