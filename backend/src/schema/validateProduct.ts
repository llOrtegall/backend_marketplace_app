import { z } from "zod"

const numericField = (label: string) =>
  z.union([z.number(), z.string()]).refine((value) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return !isNaN(num) && num >= 0;
  }, `${label} must be a non-negative number`);

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional().nullable(),
  value: numericField("Value"),
  price: numericField("Price"),
  stock: z.coerce.number().int().min(0, "Stock must be a non-negative integer").optional(),
  isActive: z.union([z.boolean(), z.string()]).transform((v) =>
    typeof v === "string" ? v === "true" : v
  ).optional(),
})

export type ProductInput = z.infer<typeof productSchema>;

export const validateProduct = (data: unknown) => {
  return productSchema.safeParse(data);
}
