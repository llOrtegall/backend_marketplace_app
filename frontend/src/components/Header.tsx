import { ShoppingBagIcon, UserRound, UserRoundCheck } from "lucide-react";
import { signOut, useSession } from "@/lib/auth-client";
import ShoppingCartButton from "./ShoppingCartButton";
import { Link } from "react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function Header() {
  const { data } = useSession();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const handleClickProfile = () => {
    setShowProfileMenu((prev) => !prev);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Sesión cerrada correctamente");
    } catch {
      toast.error("No se pudo cerrar sesión");
    } finally {
      setShowProfileMenu(false);
    }
  };

  useEffect(() => {
    if (!showProfileMenu) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showProfileMenu]);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <figure className="flex items-center space-x-2">
          <ShoppingBagIcon className="size-6 text-gray-700" />
          <figcaption className="text-lg font-bold text-gray-900">Store Aidee</figcaption>
        </figure>

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

        <section className="flex items-center space-x-4">
          <div className="relative" ref={profileMenuRef}>
            {data?.user ? (
              <button
                type="button"
                onClick={handleClickProfile}
                aria-expanded={showProfileMenu}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-xl cursor-pointer px-2 py-1 text-gray-700 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900"
              >
                {data.user.image ? (
                  <img
                    src={data.user.image}
                    loading="lazy"
                    alt="Avatar del usuario"
                    className="size-8 rounded-full object-cover ring-1 ring-gray-200"
                  />
                ) : (
                  <UserRoundCheck className="size-8 text-gray-700" />
                )}
                <p className="hidden text-sm font-medium sm:block">{data.user.name}</p>
              </button>
            ) : (
              <Link to="/login" className="flex items-center font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200">
                <UserRound className="size-8 text-gray-700" />
                <p className="mt-0.5">Iniciar sesión</p>
              </Link>
            )}

            {showProfileMenu && (
              <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg z-20">
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">{data?.user?.name}</p>
                  <p className="mt-0.5 truncate text-xs text-gray-500">{data?.user?.email}</p>
                </div>
                <ul className="py-1">
                  <li>
                    <button
                      type="button"
                      className="w-full px-4 py-2 text-left text-sm cursor-pointer text-gray-700 transition-colors hover:bg-gray-100"
                    >
                      Perfil
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left text-sm cursor-pointer text-red-600 transition-colors hover:bg-red-50"
                    >
                      Cerrar sesión
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
          <ShoppingCartButton />
        </section>
      </div>
    </header>
  );
}