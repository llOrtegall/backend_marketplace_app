import { signIn, signOut, authClient } from "../lib/auth-client";


export function AuthSessionComponent() {
  const { data } = authClient.useSession();

  return (
    <section className="border rounded p-2 text-sm">
      {data ? (
        <>
          <p>Hola, {data.user.name}</p>
          <button
            type="button"
            onClick={async () => {
              await signOut();
            }}
          >
            Sign Out
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={async () => {
            await signIn.social({ provider: "google", callbackURL: "/" });
          }}
        >
          Sign In with Google
        </button>
      )
      }
    </section>
  );
}