// email.service.js — Handles order confirmation email delivery using Nodemailer
//
// If GMAIL_APP_PASSWORD is not configured in .env, it skips sending gracefully
// with a console warning, ensuring checkout never breaks.
//
// Uses a beautifully styled HTML template matching Amazon's invoice receipt.

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;

// Create SMTP transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

/**
 * Sends a premium styled HTML order confirmation email to the user
 * @param {Object} order - Full Sequelize Order object with items, product, and address
 * @param {Object} user - User object containing email and name
 */
export const sendOrderConfirmationEmail = async (order, user) => {
  if (!GMAIL_APP_PASSWORD) {
    console.warn('⚠️  [Email Service] Skipped email delivery: GMAIL_APP_PASSWORD is not set in .env.');
    return { success: false, reason: 'app_password_missing' };
  }

  const items = order.items || [];
  const address = order.address || {};
  
  // Format price
  const fmt = (val) => parseFloat(val).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  
  // Calculate delivery date (placed_at + 3 days)
  const placedDate = order.placed_at ? new Date(order.placed_at) : new Date();
  const deliveryDate = new Date(placedDate);
  deliveryDate.setDate(placedDate.getDate() + 3);
  const deliveryDateStr = deliveryDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Generate HTML for items
  const itemsHtml = items.map(item => `
    <tr style="border-bottom: 1px solid #eaeaea;">
      <td style="padding: 12px 8px; font-size: 14px; color: #333333;">
        <strong>${item.product?.name || 'Product'}</strong>
        <div style="font-size: 12px; color: #666666; margin-top: 4px;">Qty: ${item.quantity}</div>
      </td>
      <td style="padding: 12px 8px; text-align: right; font-size: 14px; font-weight: 600; color: #333333;">
        ₹${fmt(item.unit_price)}
      </td>
      <td style="padding: 12px 8px; text-align: right; font-size: 14px; font-weight: 600; color: #B12704;">
        ₹${fmt(parseFloat(item.unit_price) * item.quantity)}
      </td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation — Amazon.in</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f6f6f6; margin: 0; padding: 20px; color: #333333;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #dddddd; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background-color: #131921; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-style: italic; font-weight: 800;">
            amazon<span style="color: #FF9900;">.in</span>
          </h1>
          <p style="color: #cccccc; margin: 5px 0 0 0; font-size: 14px;">Order Placed Successfully!</p>
        </div>
        
        <!-- Body -->
        <div style="padding: 24px;">
          <h2 style="font-size: 18px; color: #007600; margin-top: 0; margin-bottom: 16px;">
            Thank you for your order, ${user.name || 'Customer'}!
          </h2>
          
          <p style="font-size: 14px; line-height: 1.5; color: #555555; margin-bottom: 24px;">
            We've received your order and are getting it ready for shipment. Below are your order summary and estimated delivery details.
          </p>

          <!-- Order details box -->
          <div style="background-color: #f7f9fa; border: 1px solid #e7ebed; border-radius: 6px; padding: 16px; margin-bottom: 24px; font-size: 13px;">
            <div style="margin-bottom: 8px;"><strong>Order ID:</strong> <span style="font-family: monospace; color: #007185;">${order.id}</span></div>
            <div style="margin-bottom: 8px;"><strong>Estimated Delivery:</strong> <span style="color: #007600; font-weight: bold;">${deliveryDateStr}</span></div>
            <div style="margin-bottom: 8px;"><strong>Payment Method:</strong> Pay on Delivery (POD)</div>
            <div>
              <strong>Delivery Address:</strong><br />
              <div style="margin-top: 4px; color: #555555; padding-left: 10px; border-left: 2px solid #dddddd;">
                ${address.full_name}<br />
                ${address.line1}${address.line2 ? `, ${address.line2}` : ''}<br />
                ${address.city}, ${address.state} — ${address.pincode}
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <h3 style="font-size: 16px; border-bottom: 2px solid #131921; padding-bottom: 8px; margin-bottom: 12px; color: #131921;">
            Order Details
          </h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background-color: #f7f9fa; border-bottom: 1px solid #dddddd;">
                <th style="padding: 8px; text-align: left; font-size: 13px; color: #666666;">Item</th>
                <th style="padding: 8px; text-align: right; font-size: 13px; color: #666666; width: 80px;">Price</th>
                <th style="padding: 8px; text-align: right; font-size: 13px; color: #666666; width: 80px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Pricing summary -->
          <div style="float: right; width: 240px; margin-bottom: 20px; font-size: 14px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #666666;">Subtotal:</span>
              <span style="font-weight: 600;">₹${fmt(order.subtotal)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #666666;">Shipping:</span>
              <span style="font-weight: 600;">${parseFloat(order.shipping_fee) === 0 ? 'FREE' : `₹${fmt(order.shipping_fee)}`}</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 1px solid #dddddd; padding-top: 8px; margin-top: 8px;">
              <strong style="color: #131921; font-size: 16px;">Grand Total:</strong>
              <strong style="color: #B12704; font-size: 16px;">₹${fmt(order.total)}</strong>
            </div>
          </div>
          <div style="clear: both;"></div>

        </div>

        <!-- Footer -->
        <div style="background-color: #eaeded; padding: 20px; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #dddddd;">
          <p style="margin: 0 0 10px 0;">This email was sent from a demo Amazon Clone application.</p>
          <div style="margin-bottom: 10px;">
            <a href="#" style="color: #007185; text-decoration: none; margin: 0 10px;">Conditions of Use</a>
            <a href="#" style="color: #007185; text-decoration: none; margin: 0 10px;">Privacy Notice</a>
            <a href="#" style="color: #007185; text-decoration: none; margin: 0 10px;">Customer Support</a>
          </div>
          <p style="margin: 0;">© 2026 Amazon.com, Inc. or its affiliates. All rights reserved.</p>
        </div>

      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Amazon.in Clone" <${GMAIL_USER}>`,
    to: user.email,
    subject: `Your Amazon.in order of ₹${fmt(order.total)} has been placed!`,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ [Email Service] Order confirmation email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ [Email Service] Failed to send order confirmation email:', error);
    return { success: false, reason: 'smtp_error', error: error.message };
  }
};
