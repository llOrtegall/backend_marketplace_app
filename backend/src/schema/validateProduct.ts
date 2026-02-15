import { z } from "zod"

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional().nullable(),
  price: z.union([z.number(), z.string()]).refine((value) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return !isNaN(num) && num >= 0;
  }, "Price must be a non-negative number"),
  stock: z.number().int().min(0, "Stock must be a non-negative integer").optional(),
  isActive: z.boolean().optional(),
})

export type ProductInput = z.infer<typeof productSchema>;

export const validateProduct = (data: unknown) => {
  return productSchema.safeParse(data);
}