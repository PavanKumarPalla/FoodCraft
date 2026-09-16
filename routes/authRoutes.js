import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Helper to generate signed JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'foodcraft_fallback_secret_key_2026',
    { expiresIn: '30d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user in MongoDB
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, dietaryType, healthGoals } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists.',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      profile: {
        dietaryType: dietaryType || 'All',
        healthGoals: healthGoals || ['High Protein', 'Balanced Nutrition'],
      },
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully in MongoDB!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        favorites: user.favorites,
        mealPlan: user.mealPlan,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    // Find user and include password field for validation
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Validate password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
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
    const { profile, name } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
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

// @route   GET /api/auth/stats
// @desc    Get total users count (Public metric)
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    res.json({
      success: true,
      totalUsers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
