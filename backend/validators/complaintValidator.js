import { z } from 'zod';

export const createComplaintSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Please provide a valid email'),
  phone: z.string().optional(),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  title: z.string().min(5, 'Title must be at least 5 characters long').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().min(15, 'Description must be at least 15 characters long'),
  category: z.string().min(1, 'Category is required'),
  location: z.string().min(2, 'Location must be at least 2 characters long'),
});
