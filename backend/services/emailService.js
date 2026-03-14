import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import transporter from './transporter.js';

// Get the directory of this module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read logo once (safely) - navigate up from backend to frontend
const logoPath = path.resolve(__dirname, '..', '..', 'frontend', 'src', 'assets', 'logo.png');
let logoContent;
try {
  logoContent = fs.readFileSync(logoPath);
} catch (err) {
  console.error('Logo file not found at:', logoPath);
  logoContent = null;
}

// Contagion Color Scheme
const colors = {
  void: '#050508',
  abyss: '#0A0B10',
  obsidian: '#0F1118',
  phantom: '#1E2233',
  toxic: '#22C55E',
  toxicDark: '#16A34A',
  viral: '#8B5CF6',
  viralDark: '#7C3AED',
  white: '#FFFFFF',
};

// Email Templates
const getVerificationEmailTemplate = (verifyUrl, username, logoCid) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - Contagion</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.void}; font-family: 'DM Sans', system-ui, -apple-system, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: ${colors.void}; border: 1px solid ${colors.phantom}; border-radius: 8px; overflow: hidden;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${colors.obsidian} 0%, ${colors.phantom} 100%); padding: 40px 30px; text-align: center; border-bottom: 2px solid ${colors.phantom};">
      ${logoContent ? `<img src="cid:${logoCid}" alt="Contagion" style="max-width: 200px; height: auto; margin-bottom: 15px;">` : ''}
      <h1 style="margin: 0; color: ${colors.white}; font-size: 28px; font-weight: 700; letter-spacing: 2px;">CONTAGION</h1>
      <p style="margin: 5px 0 0; color: ${colors.toxic}; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Security Analysis Platform</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: ${colors.white}; font-size: 24px; margin: 0 0 20px; font-weight: 600;">Welcome to Contagion</h2>

      <p style="color: #A0A0A0; font-size: 16px; line-height: 1.6; margin: 15px 0;">
        Hello${username ? `, ${username}` : ''},
      </p>

      <p style="color: #A0A0A0; font-size: 16px; line-height: 1.6; margin: 15px 0;">
        Thank you for registering with Contagion. Please verify your email address to unlock your full security analysis capabilities.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}"
           style="display: inline-block; padding: 15px 40px; background-color: ${colors.toxic}; color: ${colors.white}; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);">
          VERIFY EMAIL
        </a>
      </div>

      <p style="color: #A0A0A0; font-size: 14px; line-height: 1.6; margin: 15px 0;">
        If the button doesn't work, copy and paste this URL into your browser:
      </p>
      <p style="color: ${colors.viral}; font-size: 12px; margin: 10px 0; word-break: break-all; font-family: 'JetBrains Mono', monospace;">
        ${verifyUrl}
      </p>

      <!-- Security Notice -->
      <div style="background-color: ${colors.obsidian}; border-left: 3px solid ${colors.toxic}; padding: 15px 20px; margin: 25px 0;">
        <p style="margin: 0; color: ${colors.white}; font-size: 13px; line-height: 1.5;">
          <strong style="color: ${colors.toxic};">Security Note:</strong> This verification link will expire in 24 hours. If you didn't create an account with Contagion, please ignore this email.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: ${colors.obsidian}; padding: 25px 30px; border-top: 1px solid ${colors.phantom}; text-align: center;">
      <p style="margin: 0; color: #707070; font-size: 12px;">
        This is an automated message from Contagion. Please do not reply directly to this email.
      </p>
      <p style="margin: 10px 0 0; color: #505050; font-size: 11px;">
        &copy; 2026 Contagion. All rights reserved.
      </p>
    </div>
  </div>

  <!-- Background for email client -->
  <div style="background-color: ${colors.void}; padding: 20px; text-align: center;">
    <p style="color: #505050; font-size: 11px; margin: 0;">
      If you're having trouble viewing this email,
      <a href="${verifyUrl}" style="color: ${colors.toxic}; text-decoration: underline;">click here to verify</a>
    </p>
  </div>
</body>
</html>
`;

const getPasswordResetEmailTemplate = (resetUrl, username, logoCid) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Contagion</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.void}; font-family: 'DM Sans', system-ui, -apple-system, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: ${colors.void}; border: 1px solid ${colors.phantom}; border-radius: 8px; overflow: hidden;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${colors.obsidian} 0%, ${colors.phantom} 100%); padding: 40px 30px; text-align: center; border-bottom: 2px solid ${colors.phantom};">
      ${logoContent ? `<img src="cid:${logoCid}" alt="Contagion" style="max-width: 200px; height: auto; margin-bottom: 15px;">` : ''}
      <h1 style="margin: 0; color: ${colors.white}; font-size: 28px; font-weight: 700; letter-spacing: 2px;">CONTAGION</h1>
      <p style="margin: 5px 0 0; color: ${colors.toxic}; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Security Analysis Platform</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: ${colors.white}; font-size: 24px; margin: 0 0 20px; font-weight: 600;">Password Reset Request</h2>

      <p style="color: #A0A0A0; font-size: 16px; line-height: 1.6; margin: 15px 0;">
        Hello${username ? `, ${username}` : ''},
      </p>

      <p style="color: #A0A0A0; font-size: 16px; line-height: 1.6; margin: 15px 0;">
        We received a request to reset your password. Click the button below to create a new secure password for your account.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}"
           style="display: inline-block; padding: 15px 40px; background-color: ${colors.viral}; color: ${colors.white}; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);">
          RESET PASSWORD
        </a>
      </div>

      <p style="color: #A0A0A0; font-size: 14px; line-height: 1.6; margin: 15px 0;">
        If the button doesn't work, copy and paste this URL into your browser:
      </p>
      <p style="color: ${colors.toxic}; font-size: 12px; margin: 10px 0; word-break: break-all; font-family: 'JetBrains Mono', monospace;">
        ${resetUrl}
      </p>

      <!-- Security Notice -->
      <div style="background-color: ${colors.obsidian}; border-left: 3px solid ${colors.toxic}; padding: 15px 20px; margin: 25px 0;">
        <p style="margin: 0; color: ${colors.white}; font-size: 13px; line-height: 1.5;">
          <strong style="color: ${colors.toxic};">Security Note:</strong> This reset link will expire in 15 minutes for your security. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: ${colors.obsidian}; padding: 25px 30px; border-top: 1px solid ${colors.phantom}; text-align: center;">
      <p style="margin: 0; color: #707070; font-size: 12px;">
        This is an automated message from Contagion. Please do not reply directly to this email.
      </p>
      <p style="margin: 10px 0 0; color: #505050; font-size: 11px;">
        &copy; 2026 Contagion. All rights reserved.
      </p>
    </div>
  </div>

  <!-- Background for email client -->
  <div style="background-color: ${colors.void}; padding: 20px; text-align: center;">
    <p style="color: #505050; font-size: 11px; margin: 0;">
      If you're having trouble viewing this email,
      <a href="${resetUrl}" style="color: ${colors.toxic}; text-decoration: underline;">click here to reset</a>
    </p>
  </div>
</body>
</html>
`;

// Send verification email
export const sendVerificationEmail = async (email, userId, username) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const token = jwt.sign(
    { userId, email, type: 'verification' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.EMAIL_VERIFICATION_EXPIRES_IN || '24h' }
  );

  const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;
  const logoCid = 'contagion-logo';

  const mailOptions = {
    from: `"Contagion" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email - Contagion',
    html: getVerificationEmailTemplate(verifyUrl, username, logoCid),
    attachments: logoContent
      ? [{ filename: 'logo.png', content: logoContent, cid: logoCid }]
      : []
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`DEV ONLY - Email Verification URL: ${verifyUrl}`);
    }
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, userId, username) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const token = jwt.sign(
    { userId, email, type: 'password-reset' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.PASSWORD_RESET_EXPIRES_IN || '15m' }
  );

  const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
  const logoCid = 'contagion-logo';

  const mailOptions = {
    from: `"Contagion" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset Your Password - Contagion',
    html: getPasswordResetEmailTemplate(resetUrl, username, logoCid),
    attachments: logoContent
      ? [{ filename: 'logo.png', content: logoContent, cid: logoCid }]
      : []
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`DEV ONLY - Password Reset URL: ${resetUrl}`);
    }
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};
