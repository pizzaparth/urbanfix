import { z } from 'zod';
import { MIN_REMARKS } from '../utils/complaintStage.js';
import { WARDS } from '../constants/wards.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const remarksSchema = z.object({
  remarks: z.string().trim().min(MIN_REMARKS, `Remarks must be at least ${MIN_REMARKS} characters long`),
});

export const assignSchema = z.object({
  fieldEmployeeId: objectId,
  note: z.string().trim().max(300).optional(),
});

export const proofSchema = z.object({
  completionNote: z.string().trim().min(5, 'Add a short note describing the work done').max(500),
});

export const leaveSchema = z
  .object({
    fromDate: z.coerce.date({ errorMap: () => ({ message: 'Choose a valid start date' }) }),
    toDate: z.coerce.date({ errorMap: () => ({ message: 'Choose a valid end date' }) }),
    reason: z.string().trim().min(5, 'Give a short reason (at least 5 characters)').max(300),
  })
  .refine((v) => v.toDate >= v.fromDate, { message: 'End date cannot be before the start date' });

export const leaveDecisionSchema = z.object({
  decision: z.enum(['approved', 'rejected'], { errorMap: () => ({ message: 'Decision must be approved or rejected' }) }),
  note: z.string().trim().max(300).optional(),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  role: z.enum(['supervisor', 'field', 'admin'], { errorMap: () => ({ message: 'Role must be supervisor, field or admin' }) }),
  phone: z.string().trim().max(20).optional(),
  employeeCode: z.string().trim().max(20).optional(),
  ward: z.enum(WARDS).optional(),
  supervisorId: objectId.optional(),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  phone: z.string().trim().max(20).optional(),
  employeeCode: z.string().trim().max(20).optional(),
  ward: z.enum(WARDS).nullable().optional(),
  supervisorId: objectId.nullable().optional(),
});
