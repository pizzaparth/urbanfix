import { z } from 'zod';

export const updateStatusSchema = z.object({
  status: z.enum(['Pending', 'In Progress', 'Resolved', 'Rejected'], {
    errorMap: () => ({ message: 'Invalid status transition state' }),
  }),
  remarks: z.string().min(10, 'Remarks must be at least 10 characters long'),
  isPublic: z.boolean().optional(),
});
