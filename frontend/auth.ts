import { betterAuth } from "better-auth";
import { Pool } from "pg";

const databaseUrl = import.meta.env.DATABASE_URL;
const baseURL = import.meta.env.BETTER_AUTH_BASE_URL;
const googleClientId = import.meta.env.GOOGLE_CLIENT_ID;
const googleClientSecret = import.meta.env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
  baseURL,
  database: new Pool({
    connectionString: databaseUrl
  }),
  emailAndPassword: {
    enabled: true
  },
  socialProviders: {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret
    }
  }
});