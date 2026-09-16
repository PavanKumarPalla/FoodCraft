// utils/emailService.js
// Brevo (Sendinblue) Email Service Integration for Food Craft

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export async function sendEmail({ toEmail, toName, subject, htmlContent }) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL || 'pavanpalla1916@gmail.com';
  const senderName = process.env.SENDER_NAME || 'Food Craft';

  if (!apiKey) {
    console.warn('⚠️ BREVO_API_KEY is not set. Email not sent.');
    return { success: false, message: 'Brevo API key missing' };
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: toEmail,
            name: toName || 'Food Craft Chef',
          },
        ],
        subject: subject,
        htmlContent: htmlContent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Brevo Email Error:', data);
      return { success: false, error: data };
    }

    console.log(`✉️ Email successfully sent via Brevo to ${toEmail} (MessageId: ${data.messageId})`);
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('❌ Failed to send email via Brevo:', error.message);
    return { success: false, error: error.message };
  }
}

// 1. Send OTP Email (for Registration or Password Reset)
export async function sendOtpEmail({ email, name, otp, purpose = 'register' }) {
  const isRegister = purpose === 'register';
  const title = isRegister ? 'Verify Your Email — Food Craft' : 'Reset Your Password — Food Craft';
  const subtitle = isRegister
    ? 'Thank you for starting your culinary journey! Use the 6-digit code below to verify your email and complete your account registration.'
    : 'We received a request to reset your Food Craft password. Use the 6-digit code below to proceed with setting a new password.';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0f17; color: #f1f5f9; margin: 0; padding: 20px; }
          .container { max-width: 540px; margin: 0 auto; background: #131b2a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 24px; text-align: center; }
          .logo { font-size: 36px; margin-bottom: 8px; }
          .brand { font-size: 24px; font-weight: 800; letter-spacing: 0.5px; color: #ffffff; margin: 0; }
          .content { padding: 32px 24px; text-align: center; }
          h2 { color: #f8fafc; font-size: 22px; margin-top: 0; margin-bottom: 12px; }
          p { color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 24px; }
          .otp-box { background: #0b0f17; border: 2px dashed #10b981; border-radius: 12px; padding: 20px; margin: 24px 0; display: inline-block; width: 80%; }
          .otp-code { font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #10b981; margin: 0; font-family: monospace; }
          .expiry-badge { display: inline-block; background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 12px; }
          .footer { background: #0f172a; padding: 20px 24px; text-align: center; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🍳</div>
            <h1 class="brand">FOOD CRAFT</h1>
            <p style="color: rgba(255,255,255,0.85); font-size: 13px; margin: 4px 0 0;">Intelligent Recipe & Meal Planning</p>
          </div>
          <div class="content">
            <h2>${isRegister ? `Welcome, ${name || 'Chef'}!` : 'Password Reset Request'}</h2>
            <p>${subtitle}</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div class="expiry-badge">⏱️ Valid for 10 minutes</div>
            </div>

            <p style="font-size: 13px; color: #64748b; margin-top: 16px;">
              If you did not request this verification code, please ignore this email or contact our support team.
            </p>
          </div>
          <div class="footer">
            © 2026 Food Craft AI. All rights reserved.<br>
            Powered by YOLOv8 Vision & RecipeNLG Intelligence.
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail({
    toEmail: email,
    toName: name || email,
    subject: `🔐 Your Food Craft Verification Code: ${otp}`,
    htmlContent,
  });
}

// 2. Send Professional Welcome Email (After Account Creation)
export async function sendWelcomeEmail({ email, name }) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0f17; color: #f1f5f9; margin: 0; padding: 20px; }
          .container { max-width: 560px; margin: 0 auto; background: #131b2a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
          .header { background: linear-gradient(135deg, #10b981 0%, #047857 100%); padding: 36px 24px; text-align: center; }
          .logo { font-size: 42px; margin-bottom: 8px; }
          .brand { font-size: 26px; font-weight: 800; color: #ffffff; margin: 0; }
          .content { padding: 32px 28px; }
          h2 { color: #f8fafc; font-size: 22px; margin-top: 0; }
          p { color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 20px; }
          .feature-grid { margin: 24px 0; }
          .feature-item { display: flex; align-items: flex-start; gap: 14px; background: #0b0f17; border: 1px solid #1e293b; border-radius: 12px; padding: 14px 16px; margin-bottom: 12px; }
          .feature-icon { font-size: 22px; flex-shrink: 0; }
          .feature-text h4 { margin: 0 0 4px; color: #f1f5f9; font-size: 15px; }
          .feature-text p { margin: 0; font-size: 13px; color: #64748b; line-height: 1.4; }
          .cta-btn { display: block; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 16px; padding: 14px 28px; border-radius: 30px; margin: 28px auto 16px; box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4); }
          .footer { background: #0f172a; padding: 20px 24px; text-align: center; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🍳</div>
            <h1 class="brand">Welcome to Food Craft!</h1>
            <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 6px 0 0;">Your Account Has Been Successfully Created 🎉</p>
          </div>
          <div class="content">
            <h2>Hello, ${name || 'Chef'}!</h2>
            <p>
              We're thrilled to welcome you to <strong>Food Craft</strong> — your personal AI-powered culinary assistant designed to simplify healthy eating, meal prep, and nutrition planning.
            </p>

            <div class="feature-grid">
              <div class="feature-item">
                <div class="feature-icon">📸</div>
                <div class="feature-text">
                  <h4>AI Ingredient Scanner</h4>
                  <p>Snap a picture of your fridge or pantry to automatically detect ingredients and discover instant recipes.</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">📅</div>
                <div class="feature-text">
                  <h4>7-Day Smart Meal Planner</h4>
                  <p>Auto-generate personalized weekly meals tailored to your calorie goals, gym protein targets, and dietary choices.</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">🥗</div>
                <div class="feature-text">
                  <h4>Regional & Dietary Filters</h4>
                  <p>Switch between Pure Veg, High Protein, Low Sugar, Low Salt, South Indian, North Indian, and Mediterranean dishes.</p>
                </div>
              </div>
            </div>

            <a href="https://foodcraft-gnlz.onrender.com/dashboard" class="cta-btn">
              🚀 Start Exploring Your Recipes
            </a>

            <p style="font-size: 13px; color: #64748b; text-align: center; margin-top: 20px;">
              Need help or have questions? Simply reply directly to this email at <a href="mailto:pavanpalla1916@gmail.com" style="color: #10b981;">pavanpalla1916@gmail.com</a>.
            </p>
          </div>
          <div class="footer">
            Crafted with ❤️ by Food Craft • <a href="https://foodcraft-gnlz.onrender.com" style="color: #10b981; text-decoration: none;">Open App</a>
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail({
    toEmail: email,
    toName: name || email,
    subject: `🎉 Welcome to Food Craft, ${name || 'Chef'}! Your Account is Ready`,
    htmlContent,
  });
}

// 3. Send Password Reset Success Notification
export async function sendPasswordResetSuccessEmail({ email, name }) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0f17; color: #f1f5f9; margin: 0; padding: 20px; }
          .container { max-width: 540px; margin: 0 auto; background: #131b2a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; }
          .header { background: #10b981; padding: 24px; text-align: center; color: white; }
          .content { padding: 28px 24px; text-align: center; }
          p { color: #94a3b8; font-size: 15px; line-height: 1.6; }
          .footer { background: #0f172a; padding: 16px; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">Password Successfully Changed 🔒</h2>
          </div>
          <div class="content">
            <p>Hello <strong>${name || 'Chef'}</strong>,</p>
            <p>Your Food Craft account password was successfully updated. You can now log in using your new credentials.</p>
            <p style="color: #ef4444; font-size: 13px;">If you did not make this change, please contact support immediately at pavanpalla1916@gmail.com.</p>
          </div>
          <div class="footer">Food Craft AI Support</div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail({
    toEmail: email,
    toName: name || email,
    subject: '🔒 Your Food Craft Password Has Been Changed',
    htmlContent,
  });
}
