import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ChevronDown, ChevronUp, PackageSearch, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = "pending" | "paid" | "cancelled";

type OrderProduct = {
  id: string;
  name: string;
  price: string;
  imageUrl: string | null;
};

type OrderItem = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  product: OrderProduct | null;
};

type Order = {
  id: string;
  status: OrderStatus;
  total: string;
  createdAt: string;
  items: OrderItem[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  paid: {
    label: "Aprobado",
    className: "bg-green-100 text-green-700 ring-1 ring-green-200",
  },
  pending: {
    label: "Pendiente",
    className: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  },
  cancelled: {
    label: "Rechazado",
    className: "bg-red-100 text-red-700 ring-1 ring-red-200",
  },
};

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const statusConfig = STATUS_CONFIG[order.status];
  const shortId = order.id.slice(0, 8).toUpperCase();

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      {/* Card header */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-gray-50"
        aria-expanded={expanded}
      >
        <div className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-2">
          {/* Order ID */}
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Pedido</p>
            <p className="font-mono text-sm font-semibold text-gray-900">#{shortId}</p>
          </div>

          {/* Date */}
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Fecha</p>
            <p className="text-sm text-gray-700">{dateFormatter.format(new Date(order.createdAt))}</p>
          </div>

          {/* Items count */}
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Productos</p>
            <p className="text-sm text-gray-700">{order.items.reduce((acc, i) => acc + i.quantity, 0)}</p>
          </div>

          {/* Total */}
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Total</p>
            <p className="text-sm font-semibold text-gray-900">
              {currencyFormatter.format(Number(order.total))}
            </p>
          </div>

          {/* Status badge */}
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusConfig.className}`}
          >
            {statusConfig.label}
          </span>
        </div>

        {/* Expand toggle */}
        <span className="shrink-0 text-gray-400">
          {expanded ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
        </span>
      </button>

      {/* Expandable items */}
      {expanded && (
        <div className="border-t border-gray-100">
          {order.items.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-500">No hay productos registrados.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 px-5 py-3">
                  {/* Product image */}
                  <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {item.product?.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="size-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.visibility = "hidden";
                        }}
                      />
                    ) : (
                      <div className="size-full" />
                    )}
                  </div>

                  {/* Product info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {item.product?.name ?? "Producto eliminado"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {currencyFormatter.format(Number(item.unitPrice))} × {item.quantity}
                    </p>
                  </div>

                  {/* Item subtotal */}
                  <p className="shrink-0 text-sm font-semibold text-gray-900">
                    {currencyFormatter.format(Number(item.subtotal))}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {/* Footer total */}
          <div className="flex justify-end border-t border-gray-100 px-5 py-3">
            <p className="text-sm text-gray-500">
              Total:{" "}
              <span className="font-bold text-gray-900">
                {currencyFormatter.format(Number(order.total))}
              </span>
            </p>
          </div>
        </div>
      )}
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axios
      .get<{ data: Order[] }>("/orders")
      .then((res) => setOrders(res.data.data))
      .catch(() => toast.error("No se pudieron cargar tus pedidos.", { position: "bottom-center" }))
      .finally(() => setIsLoading(false));
  }, []);

  const paidOrders = useMemo(() => orders.filter((o) => o.status === "paid"), [orders]);
  const otherOrders = useMemo(() => orders.filter((o) => o.status !== "paid"), [orders]);

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      </main>
    );
  }

  if (orders.length === 0) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-16 md:px-6">
        <section className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white py-16 text-center">
          <PackageSearch className="size-14 text-gray-300" strokeWidth={1.5} />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Sin pedidos aún</h1>
          <p className="mt-2 text-sm text-gray-500">
            Cuando realices una compra, aparecerá aquí.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            <ShoppingBag className="size-4" />
            Ir a comprar
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6 md:py-10">
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-gray-900">Mis pedidos</h1>

      <div className="space-y-8">
        {paidOrders.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
              Compras aprobadas ({paidOrders.length})
            </h2>
            <div className="space-y-3">
              {paidOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </section>
        )}

        {otherOrders.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
              Otras ({otherOrders.length})
            </h2>
            <div className="space-y-3">
              {otherOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
