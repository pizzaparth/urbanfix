import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please provide the target email'],
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: [true, 'Please provide the OTP code'],
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

// Configure indexing (including MongoDB TTL index for automatic expiration)
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ email: 1 });

const Otp = mongoose.model('Otp', otpSchema);
export default Otp;
