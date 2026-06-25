import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error("Failed to send email:", error);
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] Email would have been sent to ${to}: ${subject}`);
      return;
    }
    throw error;
  }
}

export async function sendOtpEmail(email: string, otp: string, name: string) {
  await sendEmail({
    to: email,
    subject: "Verify Your Email - NasByte SteCom",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Email Verification</h2>
        <p>Hi ${escapeHtml(name)},</p>
        <p>Your verification code is:</p>
        <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #666;">This code expires in 10 minutes.</p>
        <p style="color: #666;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
}

export async function sendOrderConfirmationEmail(
  email: string,
  name: string,
  orderNumber: string,
  total: number,
) {
  await sendEmail({
    to: email,
    subject: `Order Confirmed - ${orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Order Confirmed!</h2>
        <p>Hi ${escapeHtml(name)},</p>
        <p>Your order <strong>${orderNumber}</strong> has been confirmed.</p>
        <p>Total: <strong>${total.toLocaleString()} BDT</strong></p>
        <p>We'll notify you when your order ships.</p>
        <p style="color: #666;">Thank you for shopping with NasByte SteCom!</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string,
) {
  await sendEmail({
    to: email,
    subject: "Reset Your Password - NasByte SteCom",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hi ${escapeHtml(name)},</p>
        <p>We received a request to reset your password. Click the button below to proceed:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #666;">This link expires in 1 hour.</p>
        <p style="color: #666;">If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
      </div>
    `,
  });
}
