const axios = require('axios');
require('dotenv').config();


async function sendSMS({
  senderId,
  message,
  contacts,
  deliveryReportUrl = 'https://your-server.com/delivery-callback',
}) {
  const url = 'https://messaging.kilakona.co.tz/api/v1/vendor/message/send';

  const data = {
    senderId,
    messageType: 'text',
    message,
    contacts, // Comma-separated numbers or a single number, e.g. '255712345678,255713456789'
    deliveryReportUrl,
  };

  const headers = {
    'Content-Type': 'application/json',
    'api_key': process.env.kilakona_api_key,
    'api_secret': process.env.kilakona_api_secret,
  };

  try {
    const response = await axios.post(url, data, { headers });
    return response.data;
  } catch (error) {
    console.error(
      '❌ SMS sending failed:',
      error.response?.data || error.message
    );
    return { success: false, error: error.response?.data || error.message };
  }
}

module.exports = sendSMS;
