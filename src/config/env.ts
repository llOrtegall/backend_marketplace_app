import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  CORS_ORIGINS: z.string().default('*'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  WOMPI_PUBLIC_KEY: z.string().min(1),
  WOMPI_PRIVATE_KEY: z.string().min(1),
  WOMPI_INTEGRITY_SECRET: z.string().min(1),
  WOMPI_EVENTS_SECRET: z.string().min(1),
  WOMPI_BASE_URL: z.string().url().default('https://sandbox.wompi.co/v1'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    'Invalid environment variables:',
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = parsed.data;
