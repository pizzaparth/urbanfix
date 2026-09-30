import { z } from 'zod';

export const applySchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name').max(80),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  institute: z.string().trim().min(2, 'Enter your institute').max(120),
  title: z.string().trim().min(2, 'Enter your title or position').max(120),
  purpose: z.string().trim().min(100, 'Describe what you intend to study (at least 100 characters)').max(3000),
  datasetScope: z.enum(['aggregate_only', 'anonymised_records']).default('aggregate_only'),
  requestedDays: z.coerce.number().int().min(1, 'Request at least 1 day').max(180, 'Access is limited to 180 days'),
});

export const decisionSchema = z.object({
  decision: z.enum(['approved', 'rejected'], { errorMap: () => ({ message: 'Decision must be approved or rejected' }) }),
  days: z.coerce.number().int().min(1).max(180).optional(),
  // Record-level access is opt-in per approval; it is never the default.
  grantRecordAccess: z.boolean().optional(),
  note: z.string().trim().max(500).optional(),
});

export const querySchema = z.object({
  groupBy: z.enum(['category', 'ward', 'status', 'urgency', 'month']).default('category'),
  category: z.string().trim().optional(),
  ward: z.string().trim().optional(),
  status: z.enum(['Pending', 'In Progress', 'Resolved', 'Rejected']).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  records: z.enum(['true', 'false']).default('false'),
  page: z.coerce.number().int().min(1).default(1),
});
