import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: 60,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number'],
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false, // Do not return password by default in queries
    },
    profile: {
      dietaryType: {
        type: String,
        enum: ['Veg', 'Non-Veg', 'Vegan', 'Eggetarian', 'All'],
        default: 'All',
      },
      healthGoals: {
        type: [String],
        default: ['High Protein', 'Balanced Nutrition'],
      },
      preferredRegions: {
        type: [String],
        default: ['South Indian', 'North Indian', 'Continental'],
      },
      dailyCalorieTarget: {
        type: Number,
        default: 2150,
      },
      dailyProteinTarget: {
        type: Number,
        default: 135,
      },
      dailyCarbsTarget: {
        type: Number,
        default: 220,
      },
      dailyFatsTarget: {
        type: Number,
        default: 65,
      },
      allergies: {
        type: [String],
        default: [],
      },
    },
    favorites: {
      type: [String], // Array of recipe IDs, e.g. ["rcp-1", "rcp-3"]
      default: ['rcp-1', 'rcp-3'],
    },
    mealPlan: {
      type: mongoose.Schema.Types.Mixed, // Stores customized daily / weekly meal slots
      default: {},
    },
    recentScans: [
      {
        ingredients: [String],
        scannedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
