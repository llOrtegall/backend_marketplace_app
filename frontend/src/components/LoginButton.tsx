import { useEffect, useState } from "react";
import { authClient } from "../lib/auth-client";

export function LoginButton() {
  const [session, setSession] =
    useState<Awaited<ReturnType<typeof authClient.getSession>> | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const data = await authClient.getSession();
        setSession(data);
      } catch (error) {
        console.error(error);
      }
    };

    void loadSession();
  }, []);

  return (
    <section>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await authClient.signIn.social({
            provider: "google",
            callbackURL: "/dashboard", // optional
          });
        }}
      >
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
          Sign in with Google
        </button>
      </form>
    </section>
  );
}