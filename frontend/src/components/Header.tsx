import { useSession, signOut } from "@/lib/auth-client";
import { Link } from "react-router";
import { useState } from "react";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data } = useSession();

  const handleSearch = (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Implement search logic here, e.g., navigate to search results page
    console.log("Searching for:", searchQuery);
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo and Brand */}
        <figure className="flex items-center space-x-2">
          <img src="/src/assets/logo.png" width={120} height={80} alt="Logo de la Tienda" />
        </figure>

        {/* Navigation */}
        <nav className="hidden md:flex">
          <ul className="flex space-x-8">
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

        <section className="flex items-center space-x-4">
          {
            data?.user ? (
              <>
                <img src={data.user.image || '/src/assets/default-avatar.png'} alt="Avatar del usuario" className="w-8 h-8 rounded-full object-cover" />
                <span className="text-gray-700 font-medium">{data.user.name}</span>
                <button
                  onClick={() => signOut()}
                  className="text-gray-700 hover:text-gray-900 transition-colors duration-200 font-medium cursor-pointer"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link to="/login" className="text-gray-700 hover:text-gray-900 transition-colors duration-200 font-medium">
                Iniciar sesión
              </Link>
            )
          }
        </section>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-gray-700">
          ☰
        </button>
      </div>
    </header>
  );
}