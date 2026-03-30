const fetch = require('node-fetch'); // Make sure you have node-fetch installed

/**
 * Send notification via multiple channels
 * Currently supports: ntfy.sh and Twilio SMS
 */
async function sendNotification({
  topic = process.env.NTFY_TOPIC || "areniq-alerts",
  title,
  message,
  priority = "default",
  phone = [
    "+917397470456",
    "+919566126506",
    "+917395931407"
  ]                    // NEW: Optional phone number for SMS
}) {
  // 1. Send to ntfy.sh (keep your existing behavior)
  try {
    const response = await fetch(`https://ntfy.sh/${topic}`, {
      method: "POST",
      headers: {
        Title: title,
        Priority: priority,
        Tags: "warning,water,government",
        "Content-Type": "text/plain",
      },
      body: message,
    });

    if (!response.ok) {
      console.warn(`ntfy.sh notification failed with status ${response.status}`);
    }
  } catch (err) {
    console.warn("ntfy.sh notification failed:", err.message);
  }

  // 2. Send via Twilio SMS (NEW - if phone number is provided)
  if (phone) {
    await sendTwilioSMS(phone, `${title}: ${message}`);
  }

  return true;
}

/**
 * NEW: Send SMS using Twilio
 */
async function sendTwilioSMS(toPhone, messageBody) {
  if (!process.env.TWILIO_ACCOUNT_SID || 
      !process.env.TWILIO_AUTH_TOKEN || 
      !process.env.TWILIO_MESSAGING_SERVICE_SID) {
    console.warn("Twilio credentials not configured. Skipping SMS.");
    return false;
  }

  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;

    const formData = new URLSearchParams();
    formData.append('To', toPhone);
    formData.append('MessagingServiceSid', process.env.TWILIO_MESSAGING_SERVICE_SID);
    formData.append('Body', messageBody);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(
          `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Twilio error: ${errorText}`);
    }

    console.log(`[✓] Twilio SMS sent to ${toPhone}`);
    return true;

  } catch (error) {
    console.error(`[✗] Failed to send Twilio SMS to ${toPhone}:`, error.message);
    return false;
  }
}

module.exports = {
  sendNotification,
};