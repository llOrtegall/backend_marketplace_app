import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export default function ShoppingCartButton() {
  const { items, itemsCount, total, removeFromCart } = useCart();
  const [showCartSummary, setShowCartSummary] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);

  const formattedTotal = useMemo(
    () =>
      new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }).format(total),
    [total],
  );

  const handleRemoveItem = async (productId: string) => {
    const removed = await removeFromCart(productId);

    if (!removed) {
      toast.error("No se pudo remover el producto del carrito", { position: "bottom-center" });
      return;
    }

    toast.success("Producto removido del carrito", { position: "bottom-center" });
  };

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
      <button
        type="button"
        onClick={() => setShowCartSummary((prev) => !prev)}
        className="relative rounded-full p-2 text-gray-700 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
        aria-label="Carrito de compras"
        aria-expanded={showCartSummary}
      >
        <ShoppingCart className="size-8" />

        {itemsCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-pink-700 px-1 text-sm font-semibold text-white">
            {itemsCount > 99 ? "99+" : itemsCount}
          </span>
        )}
      </button>

      {showCartSummary && (
        <div className="absolute right-0 z-30 mt-3 w-88 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">Resumen del carrito</p>
            <p className="text-xs text-gray-500">{itemsCount} item(s) agregado(s)</p>
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-600">Tu carrito está vacío.</div>
          ) : (
            <>
              <ul className="max-h-80 overflow-y-auto py-1">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="size-12 rounded-lg object-cover"
                      loading="lazy"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{item.product.name}</p>
                      <p className="text-xs text-gray-500">Cantidad: {item.quantity}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleRemoveItem(item.product.id)}
                      className="text-xs font-medium text-red-600 transition hover:text-red-700"
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>

              <div className="border-t border-gray-100 px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total</span>
                  <span className="font-semibold text-gray-900">{formattedTotal}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}