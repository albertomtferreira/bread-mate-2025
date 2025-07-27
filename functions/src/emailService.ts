'use server';

import * as logger from 'firebase-functions/logger';
const Brevo = require('sib-api-v3-sdk');

// TEMPORARY: Force the correct API key for testing
const BREVO_KEY = "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"
const FROM_EMAIL = process.env.FROM_EMAIL || 'albertomtferreira@gmail.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '936095002@smtp-brevo.com';

interface OrderData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  deliveryAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postcode: string;
  };
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

  if (!BREVO_KEY) {
    logger.error('❌ CRITICAL: Brevo API key is not configured.');
    throw new Error('Brevo API key is missing');
  }

  if (!FROM_EMAIL) {
    logger.error('❌ CRITICAL: FROM_EMAIL is not configured.');
    throw new Error('FROM_EMAIL is missing');
  }

  try {
    const defaultClient = Brevo.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = BREVO_KEY;

    const apiInstance = new Brevo.TransactionalEmailsApi();
    
    const sendSmtpEmail = new Brevo.SendSmtpEmail();

    sendSmtpEmail.subject = mailOptions.subject;
    sendSmtpEmail.htmlContent = mailOptions.html;
    sendSmtpEmail.sender = { name: 'bread mate', email: FROM_EMAIL };
    sendSmtpEmail.to = [{ email: mailOptions.to }];
    sendSmtpEmail.textContent = mailOptions.text;

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    

    return result;

  } catch (error: any) {
    logger.error('❌ ERROR:', {
      errorMessage: error.message,
      errorCode: error.code,
      errorStatus: error.status,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    });

    throw error;
  } finally {
    logger.info('=== API KEY DEBUGGING END ===');
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
  if (ADMIN_EMAIL) {
    const adminMail = {
      to: ADMIN_EMAIL,
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
}

export async function sendStatusUpdateEmail(update: StatusUpdateData) {
  const { orderId, customerEmail, status } = update;

  let subject = '';
  let htmlBody = '';

  switch (status) {
    case 'Shipped':
      subject = `Your order #${orderId.substring(0, 7)} has been shipped!`;
      htmlBody = `<p>Great news! Your order is now on its way to you. You can expect it to arrive soon.</p>`;
      break;
    case 'Delivered':
      subject = `Your order #${orderId.substring(0, 7)} has been delivered!`;
      htmlBody = `<p>Our records show that your order has been delivered. We hope you enjoy your delicious bread!</p><p>If you have any issues, please don't hesitate to contact us.</p>`;
      break;
    case 'Cancelled':
      subject = `Your order #${orderId.substring(0, 7)} has been cancelled.`;
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
    html: `<h2>Order Update</h2><p>The status of your order #${orderId.substring(0, 7)} has been updated to: <strong>${status}</strong>.</p>${htmlBody}<p>Thanks,<br>The bread mate Team</p>`,
  };

  await sendEmail(mail);
}

export async function sendNewContactEmailToAdmin(contact: ContactData) {
  if (!ADMIN_EMAIL) {
    logger.error('❌ ADMIN_EMAIL not configured, skipping contact form email');
    return;
  }

  const adminMail = {
    to: ADMIN_EMAIL,
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