import { createAuthClient } from "better-auth/react"

const rawBase = import.meta.env.VITE_AUTH_BASE_URL
let baseURL = rawBase ?? "http://localhost:5000"

if (rawBase && rawBase.startsWith("/")) {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost"
  // Keep provided path and ensure it is appended to origin
  baseURL = `${origin}${rawBase}`
}

const authClient = createAuthClient({
  baseURL,
})

export const { signIn, signOut, signUp, useSession } = authClient