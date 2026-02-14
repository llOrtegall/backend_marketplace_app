import { createAuthClient } from "better-auth/react";

export function AuthSessionComponent() {
  const { useSession, signIn, signOut } = createAuthClient();
  const { data } = useSession();

  return (
    <section>
      {JSON.stringify(data)}

      <form>
        <button
          type="button"
          onClick={() => signIn.social({ provider: "google" })}
        >
          Sign In with Google
        </button>
        <button type="button" onClick={() => signOut()}>
          Sign Out
        </button>
      </form>
    </section>
  );
}