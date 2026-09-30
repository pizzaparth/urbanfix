import AppError from './appError.js';

// Parse with a zod schema or throw a 400 AppError carrying every message.
export const validate = (schema, body) => {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new AppError(result.error.errors.map((e) => e.message).join('. '), 400);
  }
  return result.data;
};
