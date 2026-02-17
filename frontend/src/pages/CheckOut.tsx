import { Minus, Plus, Trash2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";

export default function CheckOut() {
  const {
    items,
    itemsCount,
    total,
    removeFromCart,
    incrementItemQuantity,
    decrementItemQuantity,
  } = useCart();

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

  const handlePay = useCallback(() => {
    toast.info("Próximamente: integración de pago.", { position: "bottom-center" });
  }, []);

  if (items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Bolsa de compras</h1>
          <p className="mt-2 text-sm text-gray-600">Tu carrito está vacío. Agrega productos para continuar.</p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Ir a comprar
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-gray-900">Bolsa de compras</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <header className="hidden border-b border-gray-100 bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-700 md:grid md:grid-cols-[minmax(0,1.6fr)_8rem_8.5rem_8rem_2.5rem] md:gap-3">
            <p>Producto</p>
            <p>Precio</p>
            <p>Cantidad</p>
            <p>Total</p>
            <span className="sr-only">Eliminar</span>
          </header>

          <ul className="divide-y divide-gray-100">
            {items.map((item) => (
              <li key={item.id} className="px-4 py-4 md:px-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.6fr)_8rem_8.5rem_8rem_2.5rem] md:items-center md:gap-3">
                  <article className="flex min-w-0 items-center gap-3">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="size-14 rounded-lg object-cover"
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <h2 className="line-clamp-2 text-sm font-semibold text-gray-900">{item.product.name}</h2>
                    </div>
                  </article>

                  <p className="text-sm font-medium text-gray-800">
                    <span className="mr-2 text-xs font-medium text-gray-500 md:hidden">Precio:</span>
                    {currencyFormatter.format(Number(item.product.price))}
                  </p>

                  <div className="inline-flex w-fit items-center rounded-lg border border-gray-300">
                    <button
                      type="button"
                      onClick={() => void handleDecrementItem(item.product.id)}
                      className="px-2 py-1.5 text-gray-700 transition hover:bg-gray-100"
                      aria-label="Disminuir cantidad"
                    >
                      <Minus className="size-4" />
                    </button>

                    <span className="min-w-8 text-center text-sm font-semibold text-gray-900">{item.quantity}</span>

                    <button
                      type="button"
                      onClick={() => void handleIncrementItem(item.product.id)}
                      className="px-2 py-1.5 text-gray-700 transition hover:bg-gray-100"
                      aria-label="Aumentar cantidad"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>

                  <p className="text-lg font-semibold tracking-tight text-gray-900 md:text-base">
                    <span className="mr-2 text-xs font-medium text-gray-500 md:hidden">Total:</span>
                    {currencyFormatter.format(item.subtotal)}
                  </p>

                  <button
                    type="button"
                    onClick={() => void handleRemoveItem(item.product.id)}
                    className="w-fit rounded-md p-1 text-gray-500 transition hover:bg-red-600 hover:text-white"
                    aria-label="Eliminar producto"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-4 md:p-5 lg:sticky lg:top-6">
          <p className="text-sm text-gray-600">{itemsCount} producto(s)</p>
          <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between text-sm text-gray-700">
              <span>Subtotal</span>
              <span>{formattedTotal}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-700">
              <span>Envío</span>
              <span>Gratis</span>
            </div>
          </div>

          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-3xl font-bold tracking-tight text-gray-900">{formattedTotal}</span>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={handlePay}
              className="w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Ir a pagar
            </button>
            <Link
              to="/"
              className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
            >
              Seguir comprando
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}