const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");
require("dotenv").config();

/**
 * Sends an email using MailerSend.
 * 
 * @param {Object} options
 * @param {string} options.fromEmail - The verified sender email address (must be verified in MailerSend)
 * @param {string} options.fromName - The name of the sender
 * @param {string|string[]} options.to - One or multiple recipient email addresses
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text version of the email
 * @param {string} [options.html] - HTML version of the email
 * 
 * @returns {Promise<Object>} MailerSend response or error object
 */
async function sendEmail({
  fromEmail = "info@brykesmarthub.org",
  fromName = "Swahilicodes",
  to,
  subject,
  text,
  html,
}) {
  const mailerSend = new MailerSend({
    apiKey: process.env.MAILER_SEND_API_KEY,
  });

  // Convert single email string to array
  const recipients = Array.isArray(to)
    ? to.map((email) => new Recipient(email))
    : [new Recipient(to)];

  const sentFrom = new Sender(fromEmail, fromName);

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setReplyTo(sentFrom)
    .setSubject(subject);

  if (html) emailParams.setHtml(html);
  if (text) emailParams.setText(text);

  try {
    const response = await mailerSend.email.send(emailParams);
    return response;
  } catch (error) {
    console.error("❌ Email sending failed:", error.body || error.message);
    return { success: false, error: error.body || error.message };
  }
}

module.exports = sendEmail;
