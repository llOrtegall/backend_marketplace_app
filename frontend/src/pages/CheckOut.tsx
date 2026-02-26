import { Minus, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import axios from "axios";

import { useCart } from "@/contexts/CartContext";
import { useSession } from "@/lib/auth-client";

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentStatus = "pending" | "paid" | "cancelled";

type PaymentStatusResponse = {
  data: { status: PaymentStatus };
};

// ─── Component ────────────────────────────────────────────────────────────────

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
  const { data: session, isPending: isSessionLoading } = useSession();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isPaying, setIsPaying] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  /**
   * Fresh signed imageUrls fetched from /products on mount.
   * Needed because cart items loaded from localStorage have empty imageUrls
   * (stale signed URLs are not persisted — see CartContext).
   */
  const [freshImageUrls, setFreshImageUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    axios
      .get<{ data: { id: string; imageUrl: string }[] }>("/products")
      .then((res) => {
        const map: Record<string, string> = {};
        for (const p of res.data.data) map[p.id] = p.imageUrl;
        setFreshImageUrls(map);
      })
      .catch(() => {
        // silently fail — images will just show the broken fallback
      });
  }, []);

  const getImageUrl = (productId: string, fallback: string) =>
    freshImageUrls[productId] || fallback || undefined;

  // ── Currency formatter ────────────────────────────────────────────────────

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }),
    [],
  );

  const formattedTotal = useMemo(
    () => currencyFormatter.format(total),
    [currencyFormatter, total],
  );

  // ── Cart handlers ─────────────────────────────────────────────────────────

  const handleRemoveItem = useCallback(
    (productId: string) => {
      removeFromCart(productId);
      toast.success("Producto removido del carrito", { position: "bottom-center" });
    },
    [removeFromCart],
  );

  const handleIncrementItem = useCallback(
    (productId: string) => {
      const ok = incrementItemQuantity(productId);
      if (!ok) toast.error("No hay más stock disponible", { position: "bottom-center" });
    },
    [incrementItemQuantity],
  );

  const handleDecrementItem = useCallback(
    (productId: string) => {
      decrementItemQuantity(productId);
    },
    [decrementItemQuantity],
  );

  // ── Payment ───────────────────────────────────────────────────────────────

  const handlePay = useCallback(async () => {
    if (isSessionLoading) return;

    if (!session?.user) {
      toast.info("Inicia sesión para continuar con el pago.", { position: "bottom-center" });
      navigate("/login");
      return;
    }

    setIsPaying(true);
    try {
      const payload = {
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      };

      const response = await axios.post<{
        data: { wompi: { checkoutUrl: string; reference: string } };
      }>("/payments/wompi/checkout", payload);

      const { checkoutUrl, reference } = response.data?.data?.wompi ?? {};
      if (!checkoutUrl) {
        toast.error("No se pudo iniciar el pago con Wompi.", { position: "bottom-center" });
        return;
      }

      // Persist the order reference so we can recover it even if Wompi strips
      // our custom query params from the redirect URL on return.
      if (reference) {
        sessionStorage.setItem("wompi_pending_reference", reference);
      }

      window.location.href = checkoutUrl;
    } catch {
      toast.error("No se pudo iniciar el pago. Intenta de nuevo.", { position: "bottom-center" });
    } finally {
      setIsPaying(false);
    }
  }, [items, session, isSessionLoading, navigate]);

  // ── Payment return handling (Wompi redirect) ──────────────────────────────
  //
  // Wompi may strip our custom query params (?payment, ?reference) from the
  // redirect URL and only send its own: ?id=<TRANSACTION_ID>&env=test.
  //
  // To survive this, we persist the order reference in sessionStorage before
  // redirecting. On return we recover it regardless of URL state.
  //
  // Flow (priority order):
  //  1. `id` param present → call /verify (queries Wompi API directly,
  //     authoritative, works without webhooks).
  //  2. No `id` but `reference` present → poll /status (webhook-dependent).

  useEffect(() => {
    const transactionId = searchParams.get("id");     // Wompi's transaction ID
    const paymentState = searchParams.get("payment"); // Our custom trigger param
    const urlReference = searchParams.get("reference");

    // Trigger on: Wompi transaction ID returned, OR our own payment=processing param
    const isPaymentReturn = !!(transactionId || paymentState);
    if (!isPaymentReturn) return;

    // Recover reference from URL or, when Wompi strips our params, from storage
    const reference = urlReference ?? sessionStorage.getItem("wompi_pending_reference");
    if (!transactionId && !reference) return;

    let active = true;

    const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

    const cleanup = () => {
      sessionStorage.removeItem("wompi_pending_reference");
      const next = new URLSearchParams(searchParams);
      next.delete("payment");
      next.delete("reference");
      next.delete("id");
      next.delete("env");
      setSearchParams(next, { replace: true });
    };

    const verifyPayment = async () => {
      setIsCheckingPayment(true);
      try {
        let status: PaymentStatus = "pending";

        if (transactionId) {
          // Priority 1: authoritative — queries Wompi API directly
          const res = await axios.get<PaymentStatusResponse>("/payments/wompi/verify", {
            params: { transactionId, reference: reference ?? "" },
          });
          status = res.data.data.status;
        } else {
          // Priority 2: poll DB order status (depends on webhook)
          for (let attempt = 0; attempt < 6; attempt++) {
            const res = await axios.get<PaymentStatusResponse>("/payments/wompi/status", {
              params: { reference },
            });
            status = res.data.data.status;
            if (status !== "pending") break;
            if (attempt < 5) await sleep(2000);
          }
        }

        if (!active) return;

        if (status === "paid") {
          clearCart();
          toast.success("¡Pago aprobado! Tu pedido fue confirmado.", {
            id: "wompi-status",
            position: "bottom-center",
          });
        } else if (status === "cancelled") {
          toast.error("Pago rechazado o cancelado. Puedes intentarlo nuevamente.", {
            id: "wompi-status",
            position: "bottom-center",
          });
        } else {
          toast.info("Pago en proceso. Recibirás confirmación cuando sea aprobado.", {
            id: "wompi-status",
            position: "bottom-center",
          });
        }
      } catch {
        if (!active) return;
        toast.error("No se pudo validar el estado del pago.", {
          id: "wompi-status",
          position: "bottom-center",
        });
      } finally {
        if (active) {
          setIsCheckingPayment(false);
          cleanup();
        }
      }
    };

    void verifyPayment();
    return () => {
      active = false;
    };
  }, [clearCart, searchParams, setSearchParams]);

  // ── Empty cart ────────────────────────────────────────────────────────────

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

  // ── Cart with items ───────────────────────────────────────────────────────

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-gray-900">Bolsa de compras</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Items list */}
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
                  {/* Product info */}
                  <article className="flex min-w-0 items-center gap-3">
                    <img
                      src={getImageUrl(item.product.id, item.product.imageUrl)}
                      alt={item.product.name}
                      className="size-14 rounded-lg object-cover bg-gray-100"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.visibility = "hidden";
                      }}
                    />
                    <div className="min-w-0">
                      <h2 className="line-clamp-2 text-sm font-semibold text-gray-900">
                        {item.product.name}
                      </h2>
                    </div>
                  </article>

                  {/* Unit price */}
                  <p className="text-sm font-medium text-gray-800">
                    <span className="mr-2 text-xs font-medium text-gray-500 md:hidden">Precio:</span>
                    {currencyFormatter.format(Number(item.product.price))}
                  </p>

                  {/* Quantity controls */}
                  <div className="inline-flex w-fit items-center rounded-lg border border-gray-300">
                    <button
                      type="button"
                      onClick={() => handleDecrementItem(item.product.id)}
                      className="px-2 py-1.5 text-gray-700 transition hover:bg-gray-100"
                      aria-label="Disminuir cantidad"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="min-w-8 text-center text-sm font-semibold text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleIncrementItem(item.product.id)}
                      className="px-2 py-1.5 text-gray-700 transition hover:bg-gray-100"
                      aria-label="Aumentar cantidad"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <p className="text-lg font-semibold tracking-tight text-gray-900 md:text-base">
                    <span className="mr-2 text-xs font-medium text-gray-500 md:hidden">Total:</span>
                    {currencyFormatter.format(item.subtotal)}
                  </p>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.product.id)}
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

        {/* Order summary */}
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
              disabled={isPaying || isCheckingPayment || isSessionLoading}
              className="w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPaying
                ? "Redirigiendo..."
                : isCheckingPayment
                  ? "Verificando pago..."
                  : "Ir a pagar"}
            </button>
            <Link
              to="/"
              className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
            >
              Seguir comprando
            </Link>
          </div>

          {!isSessionLoading && !session?.user && (
            <p className="mt-3 text-center text-xs text-gray-500">
              Necesitas{" "}
              <Link to="/login" className="underline hover:text-gray-700">
                iniciar sesión
              </Link>{" "}
              para pagar.
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}
