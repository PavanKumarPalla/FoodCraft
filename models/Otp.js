import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['register', 'reset-password'],
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600, // MongoDB TTL: automatically deleted after 10 minutes (600 seconds)
    },
  },
  {
    timestamps: false,
  }
);

const Otp = mongoose.model('Otp', otpSchema);

export default Otp;
