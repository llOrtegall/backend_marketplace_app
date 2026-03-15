import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1),
});

export const listOrdersQuerySchema = z.object({
  status: z
    .enum(['PENDING', 'AWAITING_PAYMENT', 'CONFIRMED', 'CANCELLED'])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateOrderBody = z.infer<typeof createOrderSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
