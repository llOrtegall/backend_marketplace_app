import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HandbagIcon, Minus, Plus, Trash2, X } from "lucide-react";
import ShoppingCartToggleButton from "./ShoppingCartToggleButton";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { Link } from "react-router";

export default function ShoppingCartButton() {
  const {
    items,
    itemsCount,
    total,
    removeFromCart,
    incrementItemQuantity,
    decrementItemQuantity,
  } = useCart();
  const [showCartSummary, setShowCartSummary] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }),
    [],
  );

  const formattedTotal = useMemo(() => currencyFormatter.format(total), [currencyFormatter, total]);

  const handleRemoveItem = useCallback(async (productId: string) => {
    const removed = await removeFromCart(productId);

    if (!removed) {
      toast.error("No se pudo remover el producto del carrito", { position: "bottom-center" });
      return;
    }

    toast.success("Producto removido del carrito", { position: "bottom-center" });
  }, [removeFromCart]);

  const handleIncrementItem = useCallback(async (productId: string) => {
    const increased = await incrementItemQuantity(productId);

    if (!increased) {
      toast.error("No hay más stock disponible para este producto", { position: "bottom-center" });
    }
  }, [incrementItemQuantity]);

  const handleDecrementItem = useCallback(async (productId: string) => {
    const decreased = await decrementItemQuantity(productId);

    if (!decreased) {
      toast.error("No se pudo actualizar la cantidad", { position: "bottom-center" });
    }
  }, [decrementItemQuantity]);

  const handleToggleCart = useCallback(() => {
    setShowCartSummary((prev) => !prev);
  }, []);

  const handleCloseCart = useCallback(() => {
    setShowCartSummary(false);
  }, []);

  useEffect(() => {
    if (!showCartSummary) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (!cartRef.current?.contains(event.target as Node)) {
        setShowCartSummary(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowCartSummary(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showCartSummary]);

  return (
    <div className="relative" ref={cartRef}>
      <ShoppingCartToggleButton itemsCount={itemsCount} isOpen={showCartSummary} onToggle={handleToggleCart} />

      {showCartSummary && (
        <div className="absolute right-0 z-30 mt-3 w-88 max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg sm:w-100">
          <div className="flex h-[min(42rem,calc(100vh-1.5rem))] flex-col">
            <header className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
              <div>
                <p className="text-lg font-semibold text-gray-900">Mis Compras</p>
                <p className="text-xs text-gray-500">{itemsCount} producto(s)</p>
              </div>

              <button
                type="button"
                onClick={handleCloseCart}
                className="rounded-md p-1 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                aria-label="Cerrar carrito"
              >
                <X className="size-5" />
              </button>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-col flex-1 items-center justify-center px-4 py-6 text-sm text-gray-600">
                <figure className="flex flex-col items-center bg-gray-100 p-4 rounded-full">
                  <HandbagIcon className="size-12 text-gray-500" />
                </figure>
                <p className="mt-2 text-gray-500">Tu carrito está vacío</p>
                <span className="text-gray-500">Agrega productos para comenzar tu compra</span>
              </div>
            ) : (
              <>
                <ul className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                  {items.map((item) => (
                    <li key={item.id} className="rounded-xl border border-gray-200 p-3">
                      <div className="flex items-start gap-3">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="size-16 rounded-lg object-cover"
                          loading="lazy"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <p className="line-clamp-2 text-sm font-semibold text-gray-900">{item.product.name}</p>
                            <button
                              type="button"
                              onClick={() => void handleRemoveItem(item.product.id)}
                              className="rounded-md p-1 text-gray-500 transition-all duration-200 cursor-pointer hover:opacity-100 opacity-70 hover:bg-red-600 hover:text-white"
                              aria-label="Eliminar producto"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>

                          <p className="text-xs text-gray-500">Unitario: {currencyFormatter.format(Number(item.product.price))}</p>

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <div className="inline-flex items-center rounded-lg border border-gray-300">
                              <button
                                type="button"
                                onClick={() => void handleDecrementItem(item.product.id)}
                                className="px-2 py-1.5 text-gray-700 transition-all duration-200 hover:bg-gray-100 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Disminuir cantidad"
                              >
                                <Minus className="size-4" />
                              </button>

                              <span className="min-w-8 text-center text-sm font-semibold text-gray-900">
                                {item.quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() => void handleIncrementItem(item.product.id)}
                                className="px-2 py-1.5 text-gray-700 transition-all duration-200 hover:bg-gray-100 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Aumentar cantidad"
                              >
                                <Plus className="size-4" />
                              </button>
                            </div>

                            <p className="text-base font-semibold text-gray-900">
                              {currencyFormatter.format(item.subtotal)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <footer className="border-t border-gray-200 bg-white px-4 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium text-gray-700">Total</span>
                    <span className="text-lg font-bold tracking-tight text-gray-900">{formattedTotal}</span>
                  </div>
                  <div className="flex">
                    <Link to="/checkout"
                      onClick={handleToggleCart}
                      className="mt-4 w-full text-center rounded-md bg-green-300 px-4 py-2 text-sm font-semibold text-gray-900 transition-all duration-200 hover:bg-green-400 cursor-pointer"
                    >
                      Continuar Compra
                    </Link>
                  </div>
                </footer>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}