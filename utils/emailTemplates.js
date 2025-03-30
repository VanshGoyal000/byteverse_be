/**
 * Email templates for sending styled emails
 */

// Base URL for assets - change this to your production URL
const BASE_URL = process.env.BASE_URL || 'https://byteverse.tech';
const LOGO_URL = `${BASE_URL}/logo.png`;

// Shared components
const emailHeader = `
  <div style="text-align: center; margin-bottom: 24px;">
    <img src="${LOGO_URL}" alt="ByteVerse Logo" style="height: 60px; margin: 0 auto;">
  </div>
`;

const emailFooter = `
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e1e1e8; text-align: center; color: #718096; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} ByteVerse. All rights reserved.</p>
    <p>ByteVerse is a community of developers, creators, and tech enthusiasts.</p>
    <div style="margin-top: 12px;">
      <a href="${BASE_URL}" style="color: #6e9ef5; text-decoration: none;">Website</a> ・
      <a href="${BASE_URL}/events" style="color: #6e9ef5; text-decoration: none;">Events</a> ・
      <a href="${BASE_URL}/projects" style="color: #6e9ef5; text-decoration: none;">Projects</a>
    </div>
  </div>
`;

/**
 * Template for project approval notification
 */
exports.projectApprovalTemplate = (project) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Project Has Been Approved!</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #ffffff;
          }
          .header {
            background: linear-gradient(to right, #6e9ef5, #8A2BE2);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            padding: 20px;
            background: #f8f9fa;
            border: 1px solid #e1e1e8;
            border-top: none;
            border-radius: 0 0 8px 8px;
          }
          .button {
            display: inline-block;
            padding: 10px 20px;
            background: linear-gradient(to right, #6e9ef5, #8A2BE2);
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 15px;
            font-weight: 500;
          }
          .project-card {
            border: 1px solid #e1e1e8;
            border-radius: 8px;
            overflow: hidden;
            margin: 20px 0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          }
          .project-header {
            background-color: #f1f5f9;
            padding: 12px 15px;
            border-bottom: 1px solid #e1e1e8;
          }
          .project-body {
            padding: 15px;
            background-color: white;
          }
          .tag {
            display: inline-block;
            background-color: #e9f0fe;
            color: #6e9ef5;
            border-radius: 100px;
            padding: 4px 10px;
            font-size: 12px;
            margin-right: 5px;
            margin-bottom: 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${emailHeader}
          
          <div class="header">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Congratulations! 🎉</h1>
            <p style="margin: 10px 0 0 0;">Your project has been approved!</p>
          </div>
          
          <div class="content">
            <p>Hello ${project.submitterName},</p>
            
            <p>Great news! Your project <strong>${project.title}</strong> has been reviewed and approved by our team. It's now live on the ByteVerse platform for everyone to see.</p>
            
            <div class="project-card">
              <div class="project-header">
                <h3 style="margin: 0; color: #4a5568;">${project.title}</h3>
              </div>
              <div class="project-body">
                <p style="color: #718096;">${project.description}</p>
                
                <div style="margin-top: 10px;">
                  ${project.tags && project.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')}
                </div>
              </div>
            </div>
            
            <p>We're excited to feature your work in our community showcase. Feel free to share your project link with your network!</p>
            
            <div style="text-align: center;">
              <a href="${BASE_URL}/projects" class="button">View All Projects</a>
            </div>
            
            <p style="margin-top: 20px;">Thank you for your contribution to the ByteVerse community!</p>
            
            <p>Best regards,<br>The ByteVerse Team</p>
          </div>
          
          ${emailFooter}
        </div>
      </body>
    </html>
  `;
};

/**
 * Template for project rejection notification
 */
exports.projectRejectionTemplate = (project) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Update on Your Project Submission</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #ffffff;
          }
          .header {
            background: linear-gradient(to right, #6e9ef5, #8A2BE2);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            padding: 20px;
            background: #f8f9fa;
            border: 1px solid #e1e1e8;
            border-top: none;
            border-radius: 0 0 8px 8px;
          }
          .button {
            display: inline-block;
            padding: 10px 20px;
            background: linear-gradient(to right, #6e9ef5, #8A2BE2);
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 15px;
            font-weight: 500;
          }
          .feedback-box {
            background-color: white;
            border-left: 4px solid #6e9ef5;
            padding: 15px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${emailHeader}
          
          <div class="header">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Project Submission Update</h1>
          </div>
          
          <div class="content">
            <p>Hello ${project.submitterName},</p>
            
            <p>Thank you for submitting your project <strong>${project.title}</strong> to ByteVerse.</p>
            
            <p>After careful review, we have decided that your project needs some adjustments before it can be featured on our platform. We value your contribution and would like to offer some constructive feedback to help you improve your submission.</p>
            
            <div class="feedback-box">
              <h3 style="margin-top: 0; color: #4a5568;">Feedback from our team:</h3>
              <p>${project.adminFeedback}</p>
            </div>
            
            <p>We encourage you to address the feedback and resubmit your project. We're looking forward to seeing your revised submission!</p>
            
            <div style="text-align: center;">
              <a href="${BASE_URL}/projects/submit" class="button">Submit Updated Project</a>
            </div>
            
            <p style="margin-top: 20px;">If you have any questions or need clarification on the feedback, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>The ByteVerse Team</p>
          </div>
          
          ${emailFooter}
        </div>
      </body>
    </html>
  `;
};

/**
 * Template for sending group links to event registrants
 */
exports.eventGroupLinkTemplate = (registration, event, groupLink, message) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Important Information for ${event.title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #ffffff;
          }
          .header {
            background: linear-gradient(to right, #6e9ef5, #8A2BE2);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            padding: 20px;
            background: #f8f9fa;
            border: 1px solid #e1e1e8;
            border-top: none;
            border-radius: 0 0 8px 8px;
          }
          .button {
            display: inline-block;
            padding: 10px 20px;
            background: linear-gradient(to right, #6e9ef5, #8A2BE2);
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 15px;
            font-weight: 500;
          }
          .link-box {
            background-color: #e9f0fe;
            border: 1px solid #6e9ef5;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${emailHeader}
          
          <div class="header">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Event Information</h1>
            <p style="margin: 10px 0 0 0;">${event.title}</p>
          </div>
          
          <div class="content">
            <p>Hello ${registration.name},</p>
            
            <p>Thank you for registering for <strong>${event.title}</strong>!</p>
            
            ${message ? `<p>${message}</p>` : ''}
            
            <p>Below is the link to join the event group:</p>
            
            <div class="link-box">
              <a href="${groupLink}" class="button" style="word-break: break-all;">Join Group</a>
              <p style="margin-top: 10px; font-size: 12px; color: #666;">
                Or copy this link: <br>
                <a href="${groupLink}" style="color: #6e9ef5; word-break: break-all;">${groupLink}</a>
              </p>
            </div>
            
            <p>Event Details:</p>
            <ul>
              <li><strong>Date:</strong> ${event.date}</li>
              <li><strong>Time:</strong> ${event.time || 'TBA'}</li>
              <li><strong>Location:</strong> ${event.location || 'TBA'}</li>
            </ul>
            
            <p>Your registration is confirmed and we have your information. Your ticket ID is: <strong>${registration.ticketId}</strong></p>
            
            <p>We look forward to seeing you at the event!</p>
            
            <p>Best regards,<br>The ByteVerse Team</p>
          </div>
          
          ${emailFooter}
        </div>
      </body>
    </html>
  `;
};

/**
 * Template for event registration confirmation
 * Includes a boarding pass style ticket
 */
exports.eventRegistrationTemplate = (registration, event) => {
  // Use the ticket ID from the registration object if it exists, otherwise generate a new one
  const ticketId = registration.ticketId || 
    `BV-${event._id || event.id}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  
  // For a real app, you'd generate an actual QR code image here
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(ticketId)}`;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Event Registration Confirmation</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #ffffff;
          }
          .header {
            background: linear-gradient(to right, #6e9ef5, #8A2BE2);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            padding: 20px;
            background: #f8f9fa;
            border: 1px solid #e1e1e8;
            border-top: none;
            border-radius: 0 0 8px 8px;
          }
          .ticket {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            margin: 25px auto;
            max-width: 450px;
            position: relative;
          }
          .ticket-header {
            background: linear-gradient(to right, #6e9ef5, #8A2BE2);
            padding: 15px;
            color: white;
            text-align: center;
            position: relative;
          }
          .ticket-header:after {
            content: "";
            position: absolute;
            bottom: -8px;
            left: 0;
            right: 0;
            height: 8px;
            background: linear-gradient(45deg, #ffffff 25%, transparent 25%),
                        linear-gradient(-45deg, #ffffff 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #ffffff 75%),
                        linear-gradient(-45deg, transparent 75%, #ffffff 75%);
            background-size: 16px 16px;
            background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
          }
          .ticket-body {
            padding: 20px;
          }
          .ticket-detail {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
          }
          .ticket-label {
            color: #718096;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .ticket-value {
            font-weight: 500;
            text-align: right;
          }
          .ticket-qr {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 20px;
            padding: 15px;
            border-top: 1px dashed #e1e1e8;
          }
          .ticket-number {
            font-family: monospace;
            text-align: center;
            font-size: 14px;
            margin-top: 10px;
            color: #4a5568;
          }
          .button {
            display: inline-block;
            padding: 10px 20px;
            background: linear-gradient(to right, #6e9ef5, #8A2BE2);
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 15px;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${emailHeader}
          
          <div class="header">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">You're Registered! 🎉</h1>
            <p style="margin: 10px 0 0 0;">Your ticket for ${event.title}</p>
          </div>
          
          <div class="content">
            <p>Hello ${registration.name},</p>
            
            <p>Thank you for registering for <strong>${event.title}</strong>! We're excited to have you join us.</p>
            
            <p>Please save this email as it contains your event ticket. You'll need to show it when you arrive at the event.</p>
            
            <div class="ticket">
              <div class="ticket-header">
                <h2 style="margin: 0; font-size: 18px;">EVENT TICKET</h2>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">${event.title}</p>
              </div>
              
              <div class="ticket-body">
                <div class="ticket-detail">
                  <div>
                    <div class="ticket-label">Attendee</div>
                    <div class="ticket-value">${registration.name}</div>
                  </div>
                </div>
                
                <div class="ticket-detail">
                  <div>
                    <div class="ticket-label">Date</div>
                    <div class="ticket-value">${event.date}</div>
                  </div>
                  <div>
                    <div class="ticket-label">Time</div>
                    <div class="ticket-value">${event.time || 'TBA'}</div>
                  </div>
                </div>
                
                <div class="ticket-detail">
                  <div>
                    <div class="ticket-label">Location</div>
                    <div class="ticket-value">${event.location || 'TBA'}</div>
                  </div>
                </div>
                
                <div class="ticket-qr">
                  <div style="text-align: center;">
                    <img src="${qrCodeUrl}" alt="QR Code" style="width: 120px; height: 120px;">
                    <div class="ticket-number">${ticketId}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <a href="${BASE_URL}/events/${event._id || event.id}" class="button">Event Details</a>
            </div>
            
            <p style="margin-top: 20px;">If you have any questions or need to update your registration, please contact us.</p>
            
            <p>We look forward to seeing you at the event!</p>
            
            <p>Best regards,<br>The ByteVerse Team</p>
          </div>
          
          ${emailFooter}
        </div>
      </body>
    </html>
  `;
};

/**
 * Template for community welcome email with WhatsApp link
 */
exports.communityWelcomeTemplate = (member, whatsappLink) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ByteVerse Community!</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #ffffff;
          }
          .header {
            background: linear-gradient(to right, #6e9ef5, #8A2BE2);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            padding: 20px;
            background: #f8f9fa;
            border: 1px solid #e1e1e8;
            border-top: none;
            border-radius: 0 0 8px 8px;
          }
          .whatsapp-box {
            background: #25D366;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
            color: white;
          }
          .whatsapp-button {
            display: inline-block;
            background: #ffffff;
            color: #25D366;
            font-weight: bold;
            padding: 10px 20px;
            border-radius: 30px;
            text-decoration: none;
            margin-top: 10px;
          }
          .section {
            margin-top: 25px;
            background: white;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          }
          .section-title {
            font-size: 18px;
            color: #6e9ef5;
            margin-top: 0;
            margin-bottom: 10px;
          }
          .button {
            display: inline-block;
            padding: 10px 20px;
            background: linear-gradient(to right, #6e9ef5, #8A2BE2);
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 15px;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${emailHeader}
          
          <div class="header">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Welcome to ByteVerse! 🚀</h1>
            <p style="margin: 10px 0 0 0;">You're now part of our amazing tech community</p>
          </div>
          
          <div class="content">
            <p>Hello ${member.name},</p>
            
            <p>Thank you for joining the ByteVerse community! We're thrilled to have you with us on this journey of learning, building, and growing together.</p>
            
            <div class="whatsapp-box">
              <h3 style="margin-top: 0;">Join Our WhatsApp Group</h3>
              <p>Connect with fellow community members, get updates, and participate in discussions</p>
              <a href="${whatsappLink}" class="whatsapp-button">Join Now</a>
            </div>
            
            <div class="section">
              <h3 class="section-title">What's Next?</h3>
              <ul style="padding-left: 20px; margin-bottom: 0;">
                <li>Introduce yourself in the WhatsApp group</li>
                <li>Check out our upcoming events</li>
                <li>Explore projects from community members</li>
                <li>Share your own projects and ideas</li>
              </ul>
            </div>
            
            <div class="section">
              <h3 class="section-title">Community Benefits</h3>
              <ul style="padding-left: 20px; margin-bottom: 0;">
                <li>Access to exclusive events and workshops</li>
                <li>Networking opportunities with tech professionals</li>
                <li>Collaboration on exciting projects</li>
                <li>Learning resources and mentorship</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 25px;">
              <a href="${BASE_URL}/events" class="button">Explore Upcoming Events</a>
            </div>
            
            <p style="margin-top: 25px;">If you have any questions or need assistance, feel free to reach out to us by replying to this email.</p>
            
            <p>Looking forward to seeing you in the community!</p>
            
            <p>Best regards,<br>The ByteVerse Team</p>
          </div>
          
          ${emailFooter}
        </div>
      </body>
    </html>
  `;
};
