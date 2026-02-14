import { signIn, signOut, useSession } from "@/lib/auth-client";
import { useState } from "react";

export default function Header() {
  const { data, error } = useSession();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search logic here, e.g., navigate to search results page
    console.log("Searching for:", searchQuery);
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-light text-gray-800">Aide Store</h1>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex">
          <ul className="flex space-x-8">
            <li>
              <a href="/" className="text-gray-700 hover:text-gray-900 transition-colors duration-200 font-medium">
                Inicio
              </a>
            </li>
            <li>
              <a href="/products/beauty" className="text-gray-700 hover:text-gray-900 transition-colors duration-200 font-medium">
                Belleza
              </a>
            </li>
            <li>
              <a href="/products/crafts" className="text-gray-700 hover:text-gray-900 transition-colors duration-200 font-medium">
                Artesanías
              </a>
            </li>
            <li>
              <a href="/cart" className="text-gray-700 hover:text-gray-900 transition-colors duration-200 font-medium relative">
                Carrito
                {/* Add cart item count if available */}
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  0
                </span>
              </a>
            </li>
            <li>
              <a href="/profile" className="text-gray-700 hover:text-gray-900 transition-colors duration-200 font-medium">
                Perfil
              </a>
            </li>
          </ul>
        </nav>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-sm mx-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 px-4 border border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              🔍
            </button>
          </div>
        </form>

        {/* User Section */}
        <section className="flex items-center space-x-4">
          {error && <p className="text-red-500 text-sm">{error.message}</p>}
          {!data ? (
            <button
              onClick={() => signIn.social({
                provider: "google",
                callbackURL: `${window.location.origin}/`,
                errorCallbackURL: `${window.location.origin}/`,
              })}
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
            >
              Iniciar Sesión
            </button>
          ) : (
            <div className="flex items-center space-x-3">
              <span className="hidden sm:block text-sm text-gray-700">Hola, {data.user.name}</span>
              <img
                src={data.user.image || '/default-avatar.png'}
                alt="Avatar de Usuario"
                className="w-8 h-8 rounded-full border border-gray-300"
              />
              <button
                onClick={() => signOut()}
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </section>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-gray-700">
          ☰
        </button>
      </div>
    </header>
  );
}