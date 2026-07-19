import nodemailer from 'nodemailer';
import env from '../config/env';
import logger from './logger';

let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize the email transporter.
 * In development, use Ethereal (fake SMTP) if SMTP is not configured.
 */
async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  } else {
    // Development: use Ethereal fake SMTP
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    logger.info('📧 Using Ethereal test email account');
  }

  return transporter;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using the configured transporter.
 * Logs the preview URL in development (Ethereal).
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  try {
    const transport = await getTransporter();
    const info = await transport.sendMail({
      from: env.EMAIL_FROM || 'noreply@connectworld.app',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    });

    // In development, log the preview URL
    if (env.NODE_ENV === 'development') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        logger.info(`📧 Email preview: ${previewUrl}`);
      }
    }

    logger.info(`📧 Email sent to ${options.to}: ${options.subject}`);
  } catch (error) {
    logger.error(`❌ Failed to send email to ${options.to}:`, error);
    // Don't throw — email failures shouldn't block the main flow
  }
}

/**
 * Send email verification OTP.
 */
export async function sendVerificationEmail(
  email: string,
  otp: string,
  name?: string
): Promise<void> {
  const greeting = name ? `Hi ${name},` : 'Hello,';
  await sendEmail({
    to: email,
    subject: 'Verify your ConnectWorld account',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #6C5CE7; font-size: 28px; margin: 0;">ConnectWorld</h1>
        </div>
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Verify your email address</h2>
        <p style="color: #555; line-height: 1.6; margin-bottom: 24px;">${greeting}</p>
        <p style="color: #555; line-height: 1.6; margin-bottom: 24px;">
          Use the OTP below to verify your email address. This code expires in 5 minutes.
        </p>
        <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #6C5CE7;">${otp}</span>
        </div>
        <p style="color: #999; font-size: 12px; line-height: 1.5;">
          If you didn't create an account with ConnectWorld, you can ignore this email.
        </p>
      </div>
    `,
  });
}

/**
 * Send password reset OTP.
 */
export async function sendPasswordResetEmail(
  email: string,
  otp: string,
  name?: string
): Promise<void> {
  const greeting = name ? `Hi ${name},` : 'Hello,';
  await sendEmail({
    to: email,
    subject: 'Reset your ConnectWorld password',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #6C5CE7; font-size: 28px; margin: 0;">ConnectWorld</h1>
        </div>
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Reset your password</h2>
        <p style="color: #555; line-height: 1.6; margin-bottom: 24px;">${greeting}</p>
        <p style="color: #555; line-height: 1.6; margin-bottom: 24px;">
          Use the OTP below to reset your password. This code expires in 5 minutes.
        </p>
        <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #6C5CE7;">${otp}</span>
        </div>
        <p style="color: #999; font-size: 12px; line-height: 1.5;">
          If you didn't request a password reset, please ignore this email.
        </p>
      </div>
    `,
  });
}

/**
 * Send welcome email after successful verification.
 */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'Welcome to ConnectWorld!',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #6C5CE7; font-size: 28px; margin: 0;">ConnectWorld</h1>
        </div>
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Welcome, ${name}! 🎉</h2>
        <p style="color: #555; line-height: 1.6; margin-bottom: 24px;">
          Your email has been verified successfully. You're now ready to start connecting with the world.
        </p>
        <a href="${env.CLIENT_URL}/meetings/new" 
           style="display: inline-block; background: #6C5CE7; color: white; padding: 12px 24px; 
                  border-radius: 8px; text-decoration: none; font-weight: 600;">
          Start a Meeting
        </a>
      </div>
    `,
  });
}
