type Product = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string;
  stock: number;
};

type ProductCardProps = {
  product: Product;
  isInCart: boolean;
  isCartLoading: boolean;
  onAddToCart: (productId: string) => void;
  onRemoveFromCart: (productId: string) => void;
};

export default function ProductCard({
  product,
  isInCart,
  isCartLoading,
  onAddToCart,
  onRemoveFromCart,
}: ProductCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <img
        src={product.imageUrl}
        alt={product.name}
        className="aspect-square w-full object-cover"
        loading="lazy"
      />

      <div className="space-y-3 p-4">
        <h2 className="line-clamp-1 text-base font-semibold text-gray-900">{product.name}</h2>
        <p className="line-clamp-2 text-sm text-gray-600">{product.description ?? "Sin descripción"}</p>

        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900">
            {new Intl.NumberFormat("es-CO", {
              style: "currency",
              currency: "COP",
              maximumFractionDigits: 0,
            }).format(Number(product.price))}
          </span>
          <span className="text-xs text-gray-500">Stock: {product.stock}</span>
        </div>

        {isInCart ? (
          <button
            type="button"
            onClick={() => onRemoveFromCart(product.id)}
            disabled={isCartLoading}
            className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-60"
          >
            Quitar del carrito
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onAddToCart(product.id)}
            disabled={isCartLoading || product.stock < 1}
            className="w-full rounded-xl bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-60"
          >
            {product.stock < 1 ? "Sin stock" : "Agregar al carrito"}
          </button>
        )}
      </div>
    </article>
  );
}