import { z } from 'zod';
import { UNUSABLE_PREFIX } from '../utils/invite.js';

const newPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .refine((p) => !p.startsWith(UNUSABLE_PREFIX), 'Please choose a different password');

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot exceed 50 characters'),
  email: z.string().email('Invalid email address'),
  password: newPassword,
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d+$/, 'OTP must contain only digits'),
});

export const setPasswordSchema = z.object({
  inviteToken: z.string().min(10, 'Enter the invite code from your email'),
  password: newPassword,
});
