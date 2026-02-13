import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { logger } from '../utils/logger';

// SMTP Configuration
const SMTP_HOST = process.env.SMTP_HOST || 'localhost';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@example.com';
const APP_NAME = process.env.APP_NAME || 'Auth Service';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

// Create transporter
let transporter: Transporter;

try {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });

  // Verify connection
  transporter.verify((error) => {
    if (error) {
      logger.error('SMTP connection error:', error);
    } else {
      logger.info('SMTP server connection established');
    }
  });
} catch (error) {
  logger.error('Failed to create email transporter:', error);
  throw error;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const info = await transporter.sendMail({
      from: `"${APP_NAME}" <${EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    logger.info(`Email sent successfully to ${options.to}: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send email to ${options.to}:`, error);
    return false;
  }
};

/**
 * Send verification email
 */
export const sendVerificationEmail = async (
  email: string,
  token: string
): Promise<boolean> => {
  // Backend verification URL (if needed)
  // const verificationUrl = `${APP_URL}/api/auth/verify-email?token=${token}`;
  // Use backend URL directly since frontend is not running
  const frontendUrl = `${process.env.APP_URL}/api/auth/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Doğrulama - ${APP_NAME}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 30px; background: #4F46E5; color: white !important; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        .code { background: #e5e7eb; padding: 15px; border-radius: 6px; font-family: monospace; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Email Adresinizi Doğrulayın</h1>
        </div>
        <div class="content">
          <p>Merhaba,</p>
          <p><strong>${APP_NAME}</strong> hesabınızı oluşturduğunuz için teşekkür ederiz!</p>
          <p>Email adresinizi doğrulamak için aşağıdaki butona tıklayın:</p>
          <div style="text-align: center;">
            <a href="${frontendUrl}" class="button">Email Adresimi Doğrula</a>
          </div>
          <p>Veya aşağıdaki linki tarayıcınıza kopyalayın:</p>
          <div class="code">${frontendUrl}</div>
          <p><strong>Not:</strong> Bu doğrulama linki 24 saat geçerlidir.</p>
          <p>Eğer bu hesabı siz oluşturmadıysanız, bu emaili görmezden gelebilirsiniz.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${APP_NAME}. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Email Adresinizi Doğrulayın

${APP_NAME} hesabınızı oluşturduğunuz için teşekkür ederiz!

Email adresinizi doğrulamak için aşağıdaki linki ziyaret edin:
${frontendUrl}

Bu doğrulama linki 24 saat geçerlidir.

Eğer bu hesabı siz oluşturmadıysanız, bu emaili görmezden gelebilirsiniz.

© ${new Date().getFullYear()} ${APP_NAME}
  `;

  return await sendEmail({
    to: email,
    subject: `${APP_NAME} - Email Doğrulama`,
    html,
    text,
  });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  token: string
): Promise<boolean> => {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Şifre Sıfırlama - ${APP_NAME}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #DC2626; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 30px; background: #DC2626; color: white !important; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        .code { background: #e5e7eb; padding: 15px; border-radius: 6px; font-family: monospace; margin: 15px 0; }
        .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Şifre Sıfırlama Talebi</h1>
        </div>
        <div class="content">
          <p>Merhaba,</p>
          <p><strong>${APP_NAME}</strong> hesabınız için şifre sıfırlama talebinde bulundunuz.</p>
          <p>Yeni bir şifre oluşturmak için aşağıdaki butona tıklayın:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Şifremi Sıfırla</a>
          </div>
          <p>Veya aşağıdaki linki tarayıcınıza kopyalayın:</p>
          <div class="code">${resetUrl}</div>
          <div class="warning">
            <strong>⚠️ Güvenlik Uyarısı:</strong><br>
            Bu link 1 saat geçerlidir ve sadece bir kez kullanılabilir.
          </div>
          <p>Eğer bu talebi siz yapmadıysanız, hesabınızın güvenliği için derhal bizimle iletişime geçin.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${APP_NAME}. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Şifre Sıfırlama Talebi

${APP_NAME} hesabınız için şifre sıfırlama talebinde bulundunuz.

Yeni bir şifre oluşturmak için aşağıdaki linki ziyaret edin:
${resetUrl}

Bu link 1 saat geçerlidir ve sadece bir kez kullanılabilir.

Eğer bu talebi siz yapmadıysanız, hesabınızın güvenliği için derhal bizimle iletişime geçin.

© ${new Date().getFullYear()} ${APP_NAME}
  `;

  return await sendEmail({
    to: email,
    subject: `${APP_NAME} - Şifre Sıfırlama`,
    html,
    text,
  });
};

/**
 * Send welcome email (after email verification)
 */
export const sendWelcomeEmail = async (
  email: string,
  firstName: string
): Promise<boolean> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hoş Geldiniz - ${APP_NAME}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10B981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Hoş Geldiniz!</h1>
        </div>
        <div class="content">
          <p>Merhaba ${firstName},</p>
          <p><strong>${APP_NAME}</strong> ailesine katıldığınız için çok mutluyuz!</p>
          <p>Email adresiniz başarıyla doğrulandı ve hesabınız aktif hale getirildi.</p>
          <p>Artık tüm özelliklerimizden yararlanabilirsiniz.</p>
          <p>İyi kullanımlar dileriz!</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${APP_NAME}. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hoş Geldiniz!

Merhaba ${firstName},

${APP_NAME} ailesine katıldığınız için çok mutluyuz!

Email adresiniz başarıyla doğrulandı ve hesabınız aktif hale getirildi.

İyi kullanımlar dileriz!

© ${new Date().getFullYear()} ${APP_NAME}
  `;

  return await sendEmail({
    to: email,
    subject: `${APP_NAME} - Hoş Geldiniz!`,
    html,
    text,
  });
};



/**
 * Send project invitation email
 */
export const sendProjectInvitationEmail = async (
  email: string,
  invitationKey: string,
  expiresAt: Date
): Promise<boolean> => {
  const invitationUrl = `${FRONTEND_URL}/register?invitation=${invitationKey}`;
  const expirationDate = expiresAt.toLocaleDateString('tr-TR', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Proje Davetiyesi - ${APP_NAME}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #6366F1; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 30px; background: #6366F1; color: white !important; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        .code { background: #e5e7eb; padding: 15px; border-radius: 6px; font-family: monospace; margin: 15px 0; font-size: 16px; font-weight: bold; text-align: center; letter-spacing: 1px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 Yeni Proje Davetiyesi!</h1>
        </div>
        <div class="content">
          <p>Merhaba,</p>
          <p><strong>${APP_NAME}</strong> üzerinde yeni bir proje oluşturmanız için davet edildiniz.</p>
          <p>Projenizi oluşturmak için aşağıdaki butona tıklayın:</p>
          <div style="text-align: center;">
            <a href="${invitationUrl}" class="button">Proje Oluştur</a>
          </div>
          <p>Veya aşağıdaki davetiye kodunu kullanın:</p>
          <div class="code">${invitationKey}</div>
          <p><strong>⚠️ Önemli:</strong> Bu davetiye <strong>${expirationDate}</strong> tarihine kadar geçerlidir ve sadece bir kez kullanılabilir.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${APP_NAME}. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Yeni Proje Davetiyesi!

${APP_NAME} üzerinde yeni bir proje oluşturmanız için davet edildiniz.

Projenizi oluşturmak için aşağıdaki linki kullanın:
${invitationUrl}

Davetiye Kodu: ${invitationKey}

Bu davetiye ${expirationDate} tarihine kadar geçerlidir.

© ${new Date().getFullYear()} ${APP_NAME}
  `;

  return await sendEmail({
    to: email,
    subject: `${APP_NAME} - Proje Oluşturma Davetiyesi`,
    html,
    text,
  });
};

export default transporter;
