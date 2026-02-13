// auth.config.ts
import Google from '@auth/core/providers/google'
import { defineConfig } from 'auth-astro'

export default defineConfig({
  trustHost: true,
  providers: [
    Google({
      clientId: import.meta.env.GOOGLE_CLIENT_ID,
      clientSecret: import.meta.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
})