import { registerAs } from '@nestjs/config';

export default registerAs('channels', () => ({
  // SendGrid Email Configuration
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
    fromName: process.env.SENDGRID_FROM_NAME || 'Notification System',
    enabled: Boolean(process.env.SENDGRID_API_KEY),
  },

  // Twilio SMS Configuration
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    fromNumber: process.env.TWILIO_FROM_NUMBER || '',
    enabled: Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_FROM_NUMBER,
    ),
  },

  // Firebase Cloud Messaging (FCM) Configuration
  fcm: {
    projectId: process.env.FCM_PROJECT_ID || '',
    privateKey: process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    clientEmail: process.env.FCM_CLIENT_EMAIL || '',
    enabled: Boolean(
      process.env.FCM_PROJECT_ID &&
        process.env.FCM_PRIVATE_KEY &&
        process.env.FCM_CLIENT_EMAIL,
    ),
  },

  // WebSocket is always enabled
  websocket: {
    enabled: true,
  },
}));
