import mongoose from 'mongoose';

// One active code per email. Only a SHA-256 hash of the code is stored, and each
// code allows OTP_MAX_ATTEMPTS guesses before it is deleted (utils/otp.js).
const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please provide the target email'],
      lowercase: true,
      trim: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// MongoDB TTL index removes expired codes automatically.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ email: 1 });

const Otp = mongoose.model('Otp', otpSchema);
export default Otp;
