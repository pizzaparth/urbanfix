import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, DATASET_SCOPES } from '../constants/roles.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false,
    },
    phone: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'citizen',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    // Soft delete. Staff are never hard-deleted: the audit trail on every
    // complaint they touched references them.
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastLoginAt: Date,

    // Researcher only. accessExpiresAt is a hard stop enforced in `protect`.
    researcher: {
      institute: String,
      title: String,
      accessGrantedAt: Date,
      accessExpiresAt: Date,
      datasetScope: { type: String, enum: DATASET_SCOPES, default: 'aggregate_only' },
      applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResearchApplication' },
      expiryNoticeSentAt: Date,
    },

    // Employee only (field + supervisor).
    employee: {
      employeeCode: { type: String, trim: true },
      ward: String,
      supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      phone: String,
    },

    // Invite flow — replaces emailing a plaintext password. Only the SHA-256 of
    // the token is stored; the raw token exists only in the email.
    inviteToken: { type: String, select: false },
    inviteTokenExpires: Date,
    mustSetPassword: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Unique, but only among accounts that have one (citizens and researchers don't).
userSchema.index({ 'employee.employeeCode': 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1, isActive: 1 });

// Hash the password before saving if it has been modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method to compare passwords during authentication
userSchema.methods.comparePassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);
export default User;
