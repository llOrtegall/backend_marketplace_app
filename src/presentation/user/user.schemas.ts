import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .max(72)
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});

export const updateStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'banned']),
});

export const listUsersQuerySchema = z.object({
  role: z.enum(['superadmin', 'admin', 'user']).optional(),
  status: z.enum(['active', 'inactive', 'banned']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
export type UpdateStatusBody = z.infer<typeof updateStatusSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
