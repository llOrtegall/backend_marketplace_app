import { signIn, signOut, useSession } from "@/lib/auth-client"

export default function Header() {
  const { data, error } = useSession();

  return (
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Astro Marketplace</h1>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <a href="/" className="hover:text-gray-400">
                Home
              </a>
            </li>
            <li>
              <a href="/products" className="hover:text-gray-400">
                Products
              </a>
            </li>
            <li>
              <a href="/cart" className="hover:text-gray-400">
                Cart
              </a>
            </li>
            <li>
              <a href="/profile" className="hover:text-gray-400">
                Profile
              </a>
            </li>
          </ul>
        </nav>

        <section>
          {JSON.stringify(data)}
          {error && <p className="text-red-500">{error.message}</p>}
          {!data ? (
            <button
              onClick={() => signIn.social({
                provider: "google",
                callbackURL: `${window.location.origin}/`,
                errorCallbackURL: `${window.location.origin}/`,
              })}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Sign In
            </button>
          ) : (
            <button
              onClick={() => signOut()}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Sign Out
            </button>
          )}
        </section>
      </div>
    </header>
  );
}