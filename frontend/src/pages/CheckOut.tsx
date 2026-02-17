import { Minus, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import axios from "axios";
import { useCart } from "@/contexts/CartContext";

type PaymentStatusResponse = {
  data: {
    status: "pending" | "paid" | "cancelled";
  };
};

export default function CheckOut() {
  const {
    items,
    itemsCount,
    total,
    removeFromCart,
    incrementItemQuantity,
    decrementItemQuantity,
    clearCart,
  } = useCart();
  const [isPaying, setIsPaying] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

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

  const handlePay = useCallback(async () => {
    try {
      setIsPaying(true);

      const payload = {
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      };

      const response = await axios.post<{ data: { wompi: { checkoutUrl: string } } }>(
        "/payments/wompi/checkout",
        payload,
      );

      const checkoutUrl = response.data?.data?.wompi?.checkoutUrl;

      if (!checkoutUrl) {
        toast.error("No se pudo iniciar el pago con Wompi", { position: "bottom-center" });
        return;
      }

      window.location.href = checkoutUrl;
    } catch {
      toast.error("No se pudo iniciar el pago. Verifica tu sesión e inténtalo de nuevo.", {
        position: "bottom-center",
      });
    } finally {
      setIsPaying(false);
    }
  }, [items]);

  useEffect(() => {
    const paymentState = searchParams.get("payment");
    const reference = searchParams.get("reference");

    if (!reference || !paymentState) {
      return;
    }

    let isActive = true;

    const clearPaymentParams = () => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("payment");
      nextParams.delete("reference");
      setSearchParams(nextParams, { replace: true });
    };

    const sleep = (milliseconds: number) =>
      new Promise((resolve) => {
        window.setTimeout(resolve, milliseconds);
      });

    const verifyPayment = async () => {
      setIsCheckingPayment(true);

      try {
        let status: PaymentStatusResponse["data"]["status"] = "pending";

        for (let attempt = 0; attempt < 5; attempt += 1) {
          const response = await axios.get<PaymentStatusResponse>("/payments/wompi/status", {
            params: { reference },
          });

          status = response.data.data.status;

          if (status !== "pending") {
            break;
          }

          await sleep(1200);
        }

        if (!isActive) {
          return;
        }

        if (status === "paid") {
          clearCart();
          toast.success("Pago aprobado. ¡Tu pedido fue confirmado!", {
            id: "wompi-payment-status",
            position: "bottom-center",
          });
          clearPaymentParams();
          return;
        }

        if (status === "cancelled") {
          toast.error("Pago rechazado o cancelado. Puedes intentarlo nuevamente.", {
            id: "wompi-payment-status",
            position: "bottom-center",
          });
          clearPaymentParams();
          return;
        }

        toast.info("Estamos confirmando tu pago. Actualiza en unos segundos.", {
          id: "wompi-payment-status",
          position: "bottom-center",
        });
      } catch {
        if (!isActive) {
          return;
        }

        toast.error("No se pudo validar el estado del pago.", {
          id: "wompi-payment-status",
          position: "bottom-center",
        });
      } finally {
        if (isActive) {
          setIsCheckingPayment(false);
        }
      }
    };

    void verifyPayment();

    return () => {
      isActive = false;
    };
  }, [clearCart, searchParams, setSearchParams]);

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
              disabled={isPaying || isCheckingPayment}
              className="w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              {isPaying ? "Redirigiendo..." : isCheckingPayment ? "Verificando pago..." : "Ir a pagar"}
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