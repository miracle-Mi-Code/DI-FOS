const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.ethereal.email';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || 'DFOS Academic Portal <no-reply@dfos.edu.ng>';

let transporter = null;

if (SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

/**
 * Send an email notification (or log to console in dev mode)
 * @param {Object} options { to, subject, html, text }
 */
async function sendEmail({ to, subject, html, text }) {
  console.log(`\n=================== EMAIL NOTIFICATION ===================`);
  console.log(`To     : ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body   : ${text || (html ? html.replace(/<[^>]*>?/gm, '') : '')}`);
  console.log(`==========================================================\n`);

  if (!transporter) {
    console.log('[Mailer Service] Operating in console mock mode (No SMTP credentials configured).');
    return { success: true, mock: true };
  }

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      text,
      html,
    });
    console.log('[Mailer Service] Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Mailer Service Error] Failed to send email:', error.message);
    // Non-blocking fallback
    return { success: false, error: error.message };
  }
}

/**
 * Send OTP Email
 */
async function sendOtpEmail(email, name, code) {
  const subject = `[DFOS] Your Account Verification Code: ${code}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e3a8a; margin-top: 0;">Digital File Opening System</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Thank you for registering on the Digital File Opening System (DFOS). Please use the verification code below to complete your registration:</p>
      <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-radius: 6px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1e3a8a;">${code}</span>
      </div>
      <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes. If you did not initiate this request, please ignore this email.</p>
    </div>
  `;
  return sendEmail({ to: email, subject, html, text: `Your DFOS OTP code is: ${code}` });
}

/**
 * Send Status Change Email
 */
async function sendStatusUpdateEmail(email, name, referenceNumber, status, comment = null) {
  const subject = `[DFOS Alert] Submission Status Update - ${referenceNumber}`;
  const statusColors = {
    APPROVED: '#059669',
    REJECTED: '#dc2626',
    UNDER_REVIEW: '#d97706',
    PENDING: '#2563eb',
  };
  const color = statusColors[status] || '#1e3a8a';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1e3a8a; margin-top: 0;">Digital File Opening System</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your file submission status has been updated.</p>
      <div style="background-color: #f8fafc; padding: 16px; border-left: 4px solid ${color}; border-radius: 4px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #64748b;">Reference Number:</p>
        <p style="margin: 4px 0 12px 0; font-weight: bold; font-size: 18px;">${referenceNumber}</p>
        <p style="margin: 0; font-size: 14px; color: #64748b;">New Status:</p>
        <p style="margin: 4px 0 0 0; font-weight: bold; font-size: 18px; color: ${color};">${status.replace('_', ' ')}</p>
        ${comment ? `<p style="margin: 12px 0 0 0; font-style: italic; color: #334155;">" ${comment} "</p>` : ''}
      </div>
      <p>Log in to your DFOS student dashboard to view details and next steps.</p>
    </div>
  `;
  return sendEmail({
    to: email,
    subject,
    html,
    text: `Your DFOS submission ${referenceNumber} status is now ${status}.${comment ? ` Review comment: ${comment}` : ''}`,
  });
}

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendStatusUpdateEmail,
};
