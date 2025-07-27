import * as logger from 'firebase-functions/logger';
import { defineString } from 'firebase-functions/params';
import * as Brevo from 'sib-api-v3-sdk';

// Define environment variables for configuration
const brevoApiKey = defineString('BREVO_KEY');
const fromEmail = defineString('FROM_EMAIL', { default: 'noreply@example.com' });
const adminEmail = defineString('ADMIN_EMAIL', { default: 'admin@example.com' });

interface OrderData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
}

interface StatusUpdateData {
  orderId: string;
  customerEmail: string;
  status: string;
}

interface ContactData {
    name: string;
    email: string;
    message: string;
}

/**
 * Sends an email using the Brevo (Sendinblue) API.
 */
async function sendEmail(mailOptions: { to: string; subject: string; text: string; html: string; }) {
  const SIB_API_KEY = brevoApiKey.value();
  const FROM_EMAIL = fromEmail.value();

  if (!SIB_API_KEY) {
      logger.error('Brevo API key is not configured. Email not sent.');
      return;
  }
  
  const defaultClient = Brevo.ApiClient.instance;
  const apiKey = defaultClient.authentications['api-key'];
  apiKey.apiKey = SIB_API_KEY;

  const apiInstance = new Brevo.TransactionalEmailsApi();
  const sendSmtpEmail = new Brevo.SendSmtpEmail();

  sendSmtpEmail.subject = mailOptions.subject;
  sendSmtpEmail.htmlContent = mailOptions.html;
  sendSmtpEmail.sender = { name: 'bread mate', email: FROM_EMAIL };
  sendSmtpEmail.to = [{ email: mailOptions.to }];
  sendSmtpEmail.textContent = mailOptions.text;

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    logger.info(`Email sent successfully to ${mailOptions.to}`);
  } catch (error) {
    logger.error('Error sending email via Brevo:', error);
  }
}


export async function sendNewOrderEmails(order: OrderData) {
  // 1. Send confirmation email to the customer
  const customerMail = {
    to: order.customerEmail,
    subject: `Your order confirmation #${order.orderId.substring(0, 7)}`,
    text: `Hi ${order.customerName},\n\nThank you for your order! We've received it and will start preparing it shortly.\n\nOrder ID: ${order.orderId}\nTotal: £${order.total.toFixed(2)}\n\nWe'll notify you when it's on its way.\n\nThanks,\nThe bread mate Team`,
    html: `
      <h2>Thank you for your order!</h2>
      <p>Hi ${order.customerName},</p>
      <p>We've received your order and will start preparing it shortly.</p>
      <p><strong>Order ID:</strong> ${order.orderId}</p>
      <p><strong>Total:</strong> £${order.total.toFixed(2)}</p>
      <hr>
      <ul>
        ${order.items.map(item => `<li>${item.quantity}x ${item.name}</li>`).join('')}
      </ul>
      <hr>
      <p>We'll notify you when your order is on its way.</p>
      <p>Thanks,<br>The bread mate Team</p>
    `,
  };
  await sendEmail(customerMail);

  // 2. Send notification email to the admin
  const adminMail = {
    to: adminEmail.value(),
    subject: `New Order Received: #${order.orderId.substring(0, 7)}`,
    text: `A new order has been placed by ${order.customerName} (${order.customerEmail}).\n\nOrder ID: ${order.orderId}\nTotal: £${order.total.toFixed(2)}\n\nPlease check the admin dashboard to view the order details.`,
    html: `
      <h2>New Order Received!</h2>
      <p>A new order has been placed.</p>
      <p><strong>Order ID:</strong> ${order.orderId}</p>
      <p><strong>Customer:</strong> ${order.customerName} (${order.customerEmail})</p>
      <p><strong>Total:</strong> £${order.total.toFixed(2)}</p>
      <hr>
      <ul>
        ${order.items.map(item => `<li>${item.quantity}x ${item.name}</li>`).join('')}
      </ul>
      <hr>
      <p>Please check the admin dashboard to view and process the order.</p>
    `,
  };
  await sendEmail(adminMail);
}


export async function sendStatusUpdateEmail(update: StatusUpdateData) {
    const { orderId, customerEmail, status } = update;
    
    let subject = '';
    let htmlBody = '';

    switch(status) {
        case 'Shipped':
            subject = `Your order #${orderId.substring(0,7)} has been shipped!`;
            htmlBody = `<p>Great news! Your order is now on its way to you. You can expect it to arrive soon.</p>`;
            break;
        case 'Delivered':
            subject = `Your order #${orderId.substring(0,7)} has been delivered!`;
            htmlBody = `<p>Our records show that your order has been delivered. We hope you enjoy your delicious bread!</p><p>If you have any issues, please don't hesitate to contact us.</p>`;
            break;
        case 'Cancelled':
             subject = `Your order #${orderId.substring(0,7)} has been cancelled.`;
             htmlBody = `<p>As requested, your order has been cancelled. If you have any questions, please contact our support team.</p>`;
            break;
        default:
            // Don't send emails for "Processing" or other internal statuses
            return;
    }
    
    const mail = {
        to: customerEmail,
        subject: subject,
        text: htmlBody.replace(/<[^>]+>/g, ''), // Simple text version
        html: `<h2>Order Update</h2><p>The status of your order #${orderId.substring(0,7)} has been updated to: <strong>${status}</strong>.</p>${htmlBody}<p>Thanks,<br>The bread mate Team</p>`,
    };

    await sendEmail(mail);
}


export async function sendNewContactEmailToAdmin(contact: ContactData) {
  const adminMail = {
    to: adminEmail.value(),
    subject: `New Message from ${contact.name} via Contact Form`,
    text: `You have received a new message from your website contact form.\n\nName: ${contact.name}\nEmail: ${contact.email}\nMessage:\n${contact.message}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p>You have received a new message from your website contact form.</p>
      <hr>
      <p><strong>Name:</strong> ${contact.name}</p>
      <p><strong>Email:</strong> <a href="mailto:${contact.email}">${contact.email}</a></p>
      <p><strong>Message:</strong></p>
      <blockquote style="border-left: 2px solid #cccccc; padding-left: 1rem; margin-left: 1rem; font-style: italic;">
        ${contact.message.replace(/\n/g, '<br>')}
      </blockquote>
      <hr>
      <p>You can view and archive this message in the admin dashboard.</p>
    `,
  };
  await sendEmail(adminMail);
}
