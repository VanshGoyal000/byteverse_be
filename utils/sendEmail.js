const nodemailer = require('nodemailer');
require('dotenv').config();
/**
 * Send email utility function
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email
 * @param {String} options.subject - Email subject
 * @param {String} options.text - Plain text email content (fallback)
 * @param {String} options.html - HTML email content
 * @param {Array} options.attachments - Optional email attachments
 * @returns {Promise<Object>} - Email sending result
 */
const sendEmail = async (options) => {
  // Create a test account if no SMTP credentials are provided
  let testAccount;
  if (!process.env.SMTP_HOST) {
    testAccount = await nodemailer.createTestAccount();
    console.log('Created test email account:', testAccount.user);
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || testAccount?.smtp.host || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || testAccount?.smtp.port || 587,
    secure: process.env.SMTP_SECURE === 'true' || false,
    auth: {
      user: process.env.SMTP_USER || testAccount?.user || 'test@example.com',
      pass: process.env.SMTP_PASSWORD || testAccount?.pass || 'password'
    }
  });

  // Define email options
  const mailOptions = {
    from: `${process.env.FROM_NAME || 'ByteVerse'} <${process.env.FROM_EMAIL || 'noreply@byteverse.dev'}>`,
    to: options.to,
    subject: options.subject,
    text: options.text || 'Please view this email with an HTML-compatible email client.',
    html: options.html,
    attachments: options.attachments || []
  };

  try {
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    // If using test account, log URL to preview email
    if (testAccount) {
      console.log('Email preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    console.log(`Email sent successfully to ${options.to}:`, info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = sendEmail;
