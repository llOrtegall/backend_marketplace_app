import { z, treeifyError } from "zod"

const envSchema = z.object({
  GOOGLE_CLIENT_ID: z.string({ error: "GOOGLE_CLIENT_ID is required" }).min(1, { message: "GOOGLE_CLIENT_ID cannot be empty" }),
  GOOGLE_CLIENT_SECRET: z.string({ error: "GOOGLE_CLIENT_SECRET is required" }).min(1, { message: "GOOGLE_CLIENT_SECRET cannot be empty" }),
  BETTER_AUTH_SECRET: z.string({ error: "BETTER_AUTH_SECRET is required" }).min(1, { message: "BETTER_AUTH_SECRET cannot be empty" }),
  BETTER_AUTH_URL: z.string({ error: "BETTER_AUTH_URL is required" }).min(1, { message: "BETTER_AUTH_URL cannot be empty" }),
  FRONTEND_ORIGIN: z.string({ error: "FRONTEND_ORIGIN is required" }).min(1, { message: "FRONTEND_ORIGIN cannot be empty" }),
  DATABASE_URL: z.string({ error: "DATABASE_URL is required" }).min(1, { message: "DATABASE_URL cannot be empty" }),
  DATABASE_SCHEMA: z.string({ error: "DATABASE_SCHEMA is required" }).min(1, { message: "DATABASE_SCHEMA cannot be empty" }),
  DATABASE_STORE_SCHEMA: z.string({ error: "DATABASE_STORE_SCHEMA is required" }).min(1, { message: "DATABASE_STORE_SCHEMA cannot be empty" }),
  R2_ACCOUNT_ID: z.string({ error: "R2_ACCOUNT_ID is required" }).min(1, { message: "R2_ACCOUNT_ID cannot be empty" }),
  R2_ACCESS_KEY_ID: z.string({ error: "R2_ACCESS_KEY_ID is required" }).min(1, { message: "R2_ACCESS_KEY_ID cannot be empty" }),
  R2_SECRET_ACCESS_KEY: z.string({ error: "R2_SECRET_ACCESS_KEY is required" }).min(1, { message: "R2_SECRET_ACCESS_KEY cannot be empty" }),
  R2_BUCKET_NAME: z.string({ error: "R2_BUCKET_NAME is required" }).min(1, { message: "R2_BUCKET_NAME cannot be empty" }),
  WOMPI_PUBLIC_KEY: z.string({ error: "WOMPI_PUBLIC_KEY is required" }).min(1, { message: "WOMPI_PUBLIC_KEY cannot be empty" }),
  WOMPI_INTEGRITY_SECRET: z.string({ error: "WOMPI_INTEGRITY_SECRET is required" }).min(1, { message: "WOMPI_INTEGRITY_SECRET cannot be empty" }),
  WOMPI_EVENTS_SECRET: z.string({ error: "WOMPI_EVENTS_SECRET is required" }).min(1, { message: "WOMPI_EVENTS_SECRET cannot be empty" }),
  CORS_ORIGINS: z.string({ error: "CORS_ORIGINS is required" }).default("http://localhost:5173").transform((val) => val.split(",").map(origin => origin.trim())),
  PORT: z.string({ error: "PORT is required" }).transform((val) => parseInt(val, 10)).default(3000),
})

const { success, data, error } = envSchema.safeParse(process.env)

if (!success) {
  console.error("Invalid environment variables:", treeifyError(error))
  process.exit(1)
}

export const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  BETTER_AUTH_SECRET,
  BETTER_AUTH_URL,
  FRONTEND_ORIGIN,
  DATABASE_URL,
  DATABASE_SCHEMA,
  DATABASE_STORE_SCHEMA,
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  WOMPI_PUBLIC_KEY,
  WOMPI_INTEGRITY_SECRET,
  WOMPI_EVENTS_SECRET,
  CORS_ORIGINS,
  PORT
} = data