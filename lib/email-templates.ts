// lib/email-templates.ts
// HTML email templates for driver notifications

interface EmailTemplate {
  subject: string;
  html: string;
}

interface TemplateData {
  driverName: string;
  expiryDate?: Date;
  rejectionReason?: string;
  daysRemaining?: number;
  customMessage?: string;
}

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
`;

const headerStyles = `
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  color: white;
  padding: 30px;
  text-align: center;
  border-radius: 12px 12px 0 0;
`;

const contentStyles = `
  background: #ffffff;
  padding: 30px;
  border: 1px solid #e5e7eb;
  border-top: none;
`;

const footerStyles = `
  background: #f9fafb;
  padding: 20px;
  text-align: center;
  font-size: 12px;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  border-top: none;
  border-radius: 0 0 12px 12px;
`;

const buttonStyles = `
  display: inline-block;
  background: #16a34a;
  color: white;
  padding: 12px 24px;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  margin-top: 20px;
`;

function wrapTemplate(title: string, content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="${baseStyles}">
      <div style="${headerStyles}">
        <h1 style="margin: 0; font-size: 24px;">🚖 TaxiTao</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">${title}</p>
      </div>
      <div style="${contentStyles}">
        ${content}
      </div>
      <div style="${footerStyles}">
        <p style="margin: 0;">© ${new Date().getFullYear()} TaxiTao. All rights reserved.</p>
        <p style="margin: 5px 0 0 0;">Nairobi, Kenya</p>
      </div>
    </body>
    </html>
  `;
}

export function getEmailTemplate(type: string, data: TemplateData): EmailTemplate | null {
  const { driverName, expiryDate, rejectionReason, daysRemaining, customMessage } = data;

  switch (type) {
    case 'payment_verified':
      return {
        subject: '✅ Subscription Activated - TaxiTao',
        html: wrapTemplate('Payment Verified', `
          <h2 style="color: #16a34a; margin-top: 0;">Payment Confirmed!</h2>
          <p>Hello <strong>${driverName}</strong>,</p>
          <p>Great news! Your payment has been verified and your subscription is now <strong style="color: #16a34a;">ACTIVE</strong>.</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Subscription Valid Until:</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 18px; color: #16a34a; font-weight: bold;">
              ${expiryDate ? expiryDate.toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
            </p>
          </div>
          <p>You are now visible to customers and can receive ride requests.</p>
          <a href="https://taxitao.co.ke/driver/dashboard" style="${buttonStyles}">Go to Dashboard</a>
        `),
      };

    case 'payment_rejected':
      return {
        subject: '❌ Payment Rejected - TaxiTao',
        html: wrapTemplate('Payment Issue', `
          <h2 style="color: #dc2626; margin-top: 0;">Payment Rejected</h2>
          <p>Hello <strong>${driverName}</strong>,</p>
          <p>Unfortunately, your recent payment could not be verified.</p>
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Reason:</strong></p>
            <p style="margin: 5px 0 0 0; color: #dc2626;">${rejectionReason || 'No reason provided'}</p>
          </div>
          <p>Please verify your payment details and try again, or contact support if you believe this is an error.</p>
          <a href="https://taxitao.co.ke/driver/dashboard" style="${buttonStyles}">Try Again</a>
        `),
      };

    case 'subscription_expiring':
      return {
        subject: '⚠️ Subscription Expiring Soon - TaxiTao',
        html: wrapTemplate('Subscription Reminder', `
          <h2 style="color: #f59e0b; margin-top: 0;">Subscription Expiring Soon</h2>
          <p>Hello <strong>${driverName}</strong>,</p>
          <p>Your TaxiTao subscription will expire in <strong>${daysRemaining || 3} days</strong>.</p>
          <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Expiry Date:</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 18px; color: #f59e0b; font-weight: bold;">
              ${expiryDate ? expiryDate.toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Soon'}
            </p>
          </div>
          <p>Renew now to continue receiving ride requests and stay visible to customers.</p>
          <a href="https://taxitao.co.ke/driver/dashboard" style="${buttonStyles}">Renew Subscription</a>
        `),
      };

    case 'subscription_expired':
      return {
        subject: '🚫 Subscription Expired - TaxiTao',
        html: wrapTemplate('Subscription Expired', `
          <h2 style="color: #dc2626; margin-top: 0;">Subscription Expired</h2>
          <p>Hello <strong>${driverName}</strong>,</p>
          <p>Your TaxiTao subscription has expired. You are no longer visible to customers.</p>
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;">To continue using TaxiTao, please renew your subscription.</p>
          </div>
          <a href="https://taxitao.co.ke/driver/dashboard" style="${buttonStyles}">Renew Now</a>
        `),
      };

    case 'admin_message':
      return {
        subject: '📢 Message from TaxiTao',
        html: wrapTemplate('Admin Message', `
          <h2 style="color: #2563eb; margin-top: 0;">Message from TaxiTao</h2>
          <p>Hello <strong>${driverName}</strong>,</p>
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;">${customMessage || 'You have a new message from TaxiTao admin.'}</p>
          </div>
          <a href="https://taxitao.co.ke/driver/dashboard" style="${buttonStyles}">View Dashboard</a>
        `),
      };

    default:
      return null;
  }
}
