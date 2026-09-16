import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import { protect } from '../middleware/auth.js';
import {
  sendOtpEmail,
  sendWelcomeEmail,
  sendPasswordResetSuccessEmail,
} from '../utils/emailService.js';

const router = express.Router();

// Helper to generate signed JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'foodcraft_fallback_secret_key_2026',
    { expiresIn: '30d' }
  );
};

// Generate random 6-digit numeric OTP
const generateNumericOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper to clean phone numbers (e.g. +91 9876543210 -> 9876543210 or formatted)
const normalizePhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/[\s\-\(\)]/g, '').trim();
};

// =========================================================================
// 1. REGISTRATION WITH EMAIL OTP & PHONE DUPLICATE CHECK FLOW
// =========================================================================

// @route   POST /api/auth/send-register-otp
// @desc    Step 1: Check duplicate Email & Phone in MongoDB, send 6-digit OTP
// @access  Public
router.post('/send-register-otp', async (req, res) => {
  try {
    const { email, name, phone } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = normalizePhone(phone);

    // If MongoDB is still connecting or disconnected, return a clear 503 instead of a silent crash
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message:
          'Database connection is initializing. Please verify MONGODB_URI credentials in your Render settings.',
        databaseStatus: 'disconnected',
      });
    }

    // 1. Check if Email already exists in MongoDB
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        field: 'email',
        message: `An account with the email "${cleanEmail}" already exists. Please sign in instead.`,
      });
    }

    // 2. Check if Phone Number already exists in MongoDB
    if (cleanPhone) {
      const existingPhone = await User.findOne({
        $or: [
          { phone: cleanPhone },
          { phone: phone.trim() },
          { phone: cleanPhone.slice(-10) }, // match last 10 digits
        ],
      });

      if (existingPhone) {
        return res.status(409).json({
          success: false,
          field: 'phone',
          message: `The phone number "${phone}" is already registered to another account. Please use a different number or sign in.`,
        });
      }
    }

    // Generate 6-digit OTP
    const otp = generateNumericOtp();

    // Remove any previous registration OTPs for this email
    await Otp.deleteMany({ email: cleanEmail, purpose: 'register' });

    // Store new OTP in MongoDB (auto-expires in 10 minutes via TTL)
    await Otp.create({
      email: cleanEmail,
      otp,
      purpose: 'register',
      verified: false,
    });

    console.log(`🔑 [Registration OTP] for ${cleanEmail}: ${otp}`);

    // Send email via Brevo
    let emailResult = { success: false };
    try {
      emailResult = await sendOtpEmail({
        email: cleanEmail,
        name: name || 'Chef',
        otp,
        purpose: 'register',
      });
    } catch (emailErr) {
      console.error('Brevo send error:', emailErr.message);
    }

    // If Brevo failed (e.g. IP whitelist on Brevo), provide helpful message
    if (!emailResult.success) {
      console.warn(`⚠️ Brevo email was not delivered. Fallback verification code: ${otp}`);
      return res.json({
        success: true,
        message: `Verification code generated! (Note: Check Brevo Authorised IPs settings if email is delayed. Demo code: ${otp})`,
        demoOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
        emailSent: false,
      });
    }

    res.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${cleanEmail}. Please check your inbox or spam folder.`,
      emailSent: true,
    });
  } catch (error) {
    console.error('send-register-otp error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process verification code.',
    });
  }
});

// @route   POST /api/auth/verify-register-otp
// @desc    Step 2: Check if OTP is correct before showing password section
// @access  Public
router.post('/verify-register-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and verification code.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    const otpRecord = await Otp.findOne({
      email: cleanEmail,
      otp: cleanOtp,
      purpose: 'register',
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code. Please check your code or request a new one.',
      });
    }

    // Mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    res.json({
      success: true,
      message: 'Email verified successfully! You can now set your password.',
    });
  } catch (error) {
    console.error('verify-register-otp error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify code.',
    });
  }
});

// @route   POST /api/auth/register-verified
// @desc    Step 3: Save user in DB with Email & Phone, send welcome email
// @access  Public
router.post('/register-verified', async (req, res) => {
  try {
    const { name, email, phone, otp, password, dietaryType, healthGoals } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, verified code, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = normalizePhone(phone);
    const cleanOtp = otp.toString().trim();

    // Verify OTP record exists and is verified
    const otpRecord = await Otp.findOne({
      email: cleanEmail,
      otp: cleanOtp,
      purpose: 'register',
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Verification code not found or expired. Please verify your email again.',
      });
    }

    // Double check email and phone uniqueness in MongoDB
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: `An account with this email "${cleanEmail}" already exists.`,
      });
    }

    if (cleanPhone) {
      const existingPhone = await User.findOne({
        $or: [{ phone: cleanPhone }, { phone: phone.trim() }],
      });
      if (existingPhone) {
        return res.status(409).json({
          success: false,
          message: `The phone number "${phone}" is already registered.`,
        });
      }
    }

    // Create user in MongoDB
    const user = await User.create({
      name,
      email: cleanEmail,
      phone: cleanPhone || phone || 'Not provided',
      password,
      profile: {
        dietaryType: dietaryType || 'All',
        healthGoals: healthGoals || ['High Protein', 'Balanced Nutrition'],
      },
    });

    // Delete used OTP
    await Otp.deleteMany({ email: cleanEmail, purpose: 'register' });

    // Send professional Welcome Email via Brevo
    sendWelcomeEmail({ email: cleanEmail, name }).catch((err) =>
      console.warn('Welcome email background send error:', err)
    );

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully in MongoDB! Welcome to Food Craft.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profile: user.profile,
        favorites: user.favorites,
        mealPlan: user.mealPlan,
      },
    });
  } catch (error) {
    console.error('register-verified error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during account creation.',
    });
  }
});

// =========================================================================
// 2. LOGIN WITH EITHER EMAIL OR PHONE NUMBER
// =========================================================================

// @route   POST /api/auth/login
// @desc    Authenticate user via Email OR Phone + Password
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, identifier, password } = req.body;
    const loginInput = (identifier || email || '').trim();

    if (!loginInput || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email/phone number and password.',
      });
    }

    const cleanInput = loginInput.toLowerCase();
    const cleanPhone = normalizePhone(loginInput);

    // Find user by either email or phone number in MongoDB
    const user = await User.findOne({
      $or: [
        { email: cleanInput },
        { phone: loginInput },
        { phone: cleanPhone },
        { phone: cleanPhone.slice(-10) },
      ],
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email or phone number. Please check your credentials or register.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again or click "Forgot password?".',
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profile: user.profile,
        favorites: user.favorites,
        mealPlan: user.mealPlan,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
});

// =========================================================================
// 3. FORGOT / RESET PASSWORD WITH EMAIL OTP FLOW
// =========================================================================

// @route   POST /api/auth/send-reset-otp
// @desc    Generate and send 6-digit password reset OTP
// @access  Public
router.post('/send-reset-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your account email address.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `No account found with the email "${cleanEmail}". Please check the spelling or register a new account.`,
      });
    }

    const otp = generateNumericOtp();

    // Clean old reset OTPs
    await Otp.deleteMany({ email: cleanEmail, purpose: 'reset-password' });

    // Save reset OTP
    await Otp.create({
      email: cleanEmail,
      otp,
      purpose: 'reset-password',
      verified: false,
    });

    console.log(`🔑 [Password Reset OTP] for ${cleanEmail}: ${otp}`);

    // Send reset OTP email via Brevo
    await sendOtpEmail({
      email: cleanEmail,
      name: user.name,
      otp,
      purpose: 'reset-password',
    });

    res.json({
      success: true,
      message: `A 6-digit password reset code has been sent to ${cleanEmail}.`,
    });
  } catch (error) {
    console.error('send-reset-otp error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send reset code.',
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Verify reset OTP and update password in MongoDB
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, verification code, and your new password.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    // Verify OTP
    const otpRecord = await Otp.findOne({
      email: cleanEmail,
      otp: cleanOtp,
      purpose: 'reset-password',
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code. Please request a new one.',
      });
    }

    // Find user and update password
    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.password = newPassword; // Triggers bcrypt hashing pre-save
    await user.save();

    // Delete used OTP
    await Otp.deleteMany({ email: cleanEmail, purpose: 'reset-password' });

    // Send confirmation email
    sendPasswordResetSuccessEmail({ email: cleanEmail, name: user.name }).catch((err) =>
      console.warn('Password reset confirmation email error:', err)
    );

    res.json({
      success: true,
      message: 'Password has been reset successfully! You can now sign in with your new password.',
    });
  } catch (error) {
    console.error('reset-password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset password.',
    });
  }
});

// =========================================================================
// 4. USER PROFILE & PREFERENCES ROUTES
// =========================================================================

// @route   GET /api/auth/me
// @desc    Get currently authenticated user data
// @access  Private
router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// @route   PUT /api/auth/profile
// @desc    Update user profile & dietary goals in MongoDB
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { profile, name, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (profile) {
      user.profile = { ...user.profile.toObject(), ...profile };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated in MongoDB!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profile: user.profile,
        favorites: user.favorites,
        mealPlan: user.mealPlan,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/favorites/toggle
// @desc    Toggle a recipe in user's MongoDB favorites
// @access  Private
router.post('/favorites/toggle', protect, async (req, res) => {
  try {
    const { recipeId } = req.body;
    if (!recipeId) {
      return res.status(400).json({ success: false, message: 'Recipe ID is required' });
    }

    const user = await User.findById(req.user._id);
    const index = user.favorites.indexOf(recipeId);

    if (index > -1) {
      user.favorites.splice(index, 1);
    } else {
      user.favorites.push(recipeId);
    }

    await user.save();

    res.json({
      success: true,
      favorites: user.favorites,
      isFavorite: index === -1,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/auth/mealplan
// @desc    Save customized meal plan to user's MongoDB record
// @access  Private
router.put('/mealplan', protect, async (req, res) => {
  try {
    const { mealPlan } = req.body;
    const user = await User.findById(req.user._id);

    user.mealPlan = mealPlan;
    await user.save();

    res.json({
      success: true,
      message: 'Meal plan synchronized with MongoDB!',
      mealPlan: user.mealPlan,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
