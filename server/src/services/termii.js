const axios = require('axios');

const TERMII_API_KEY = process.env.TERMII_API_KEY || 'mock_termii_api_key';
let rawSenderId = process.env.TERMII_SENDER_ID || 'DFOS';
// Standard alphanumeric sender ID validation (max 11 chars)
const TERMII_SENDER_ID = (rawSenderId.length > 11 || rawSenderId.includes('-')) ? 'DFOS' : rawSenderId;
const TERMII_BASE_URL = process.env.TERMII_BASE_URL || 'https://api.ng.termii.com/api';

/**
 * Format phone number to international format (e.g. 2348012345678)
 */
function formatPhoneNumber(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.startsWith('0')) {
    cleaned = '234' + cleaned.substring(1);
  }
  return cleaned;
}

/**
 * Generate a 6-digit numeric OTP code
 */
function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP via Termii SMS API (or fallback to console mock in dev/offline)
 * @param {string} phone 
 * @param {string} code 
 */
async function sendOtp(phone, code) {
  const formattedPhone = formatPhoneNumber(phone);
  const message = `Your DFOS verification code is ${code}. It expires in 10 minutes. Do not share this code with anyone.`;

  console.log(`\n=================== TERMII SMS OTP ===================`);
  console.log(`Recipient: ${formattedPhone} (Original: ${phone})`);
  console.log(`OTP Code : ${code}`);
  console.log(`Message  : ${message}`);
  console.log(`======================================================\n`);

  if (!TERMII_API_KEY || TERMII_API_KEY.includes('mock')) {
    console.log('[Termii Service] Operating in MOCK mode. OTP logged to console.');
    return { success: true, mock: true, code, phone: formattedPhone };
  }

  try {
    const payload = {
      to: formattedPhone,
      from: TERMII_SENDER_ID,
      sms: message,
      type: 'plain',
      channel: 'generic',
      api_key: TERMII_API_KEY,
    };

    const response = await axios.post(`${TERMII_BASE_URL}/sms/send`, payload, {
      timeout: 5000,
    });

    console.log('[Termii Service] SMS sent successfully:', response.data);
    return { success: true, data: response.data, code, phone: formattedPhone };
  } catch (error) {
    console.error('[Termii Service Error] Failed to send SMS OTP via Termii:', error.response?.data || error.message);
    // Non-blocking: return graceful status so caller flow is not interrupted
    return { success: false, error: error.message, code, phone: formattedPhone };
  }
}

/**
 * Send Notification SMS via Termii API (e.g. status change alerts)
 * @param {string} phone 
 * @param {string} message 
 */
async function sendNotification(phone, message) {
  const formattedPhone = formatPhoneNumber(phone);

  console.log(`\n=================== TERMII NOTIFICATION ===================`);
  console.log(`Recipient: ${formattedPhone}`);
  console.log(`Message  : ${message}`);
  console.log(`===========================================================\n`);

  if (!TERMII_API_KEY || TERMII_API_KEY.includes('mock')) {
    console.log('[Termii Service] Operating in MOCK mode. Notification logged to console.');
    return { success: true, mock: true, phone: formattedPhone };
  }

  try {
    const payload = {
      to: formattedPhone,
      from: TERMII_SENDER_ID,
      sms: message,
      type: 'plain',
      channel: 'generic',
      api_key: TERMII_API_KEY,
    };

    const response = await axios.post(`${TERMII_BASE_URL}/sms/send`, payload, {
      timeout: 5000,
    });

    console.log('[Termii Service] Notification sent successfully:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[Termii Service Error] Failed to send Notification via Termii:', error.response?.data || error.message);
    // Non-blocking: handle gracefully so submission action isn't aborted
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendOtp,
  sendNotification,
  formatPhoneNumber,
  generateOtpCode,
};
