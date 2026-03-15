import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(3).max(120),
  description: z.string().min(10).max(2000),
  price: z.number(),
  stock: z.number(),
  category: z.string().min(2).max(60),
  images: z.array(z.string().url()).min(1).max(10),
});

export const updateProductSchema = z
  .object({
    name: z.string().min(3).max(120).optional(),
    description: z.string().min(10).max(2000).optional(),
    price: z.number().optional(),
    stock: z.number().optional(),
    category: z.string().min(2).max(60).optional(),
    images: z.array(z.string().url()).min(1).max(10).optional(),
    status: z.enum(['active', 'inactive']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const listProductsQuerySchema = z.object({
  category: z.string().optional(),
  sellerId: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['price', 'createdAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateProductBody = z.infer<typeof createProductSchema>;
export type UpdateProductBody = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
