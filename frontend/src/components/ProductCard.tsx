type Product = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string;
  stock: number;
  isActive: boolean;
};

type ProductCardProps = {
  product: Product;
  isInCart: boolean;
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (productId: string) => void;
};

export default function ProductCard({
  product,
  isInCart,
  onAddToCart,
  onRemoveFromCart,
}: ProductCardProps) {
  return (
    <article className="h-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <img
        src={product.imageUrl}
        alt={product.name}
        className="aspect-square w-full object-cover"
        loading="lazy"
      />

      <div className="flex h-55 flex-col p-4">
        <div className="space-y-3">
          <h2 className="line-clamp-2 min-h-12 text-base font-semibold text-gray-900">{product.name}</h2>
          <p className="line-clamp-2 min-h-10 text-sm text-gray-600">{product.description ?? "Sin descripción"}</p>
        </div>

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

        <div className="mt-auto pt-4">
          {isInCart ? (
            <button
              type="button"
              onClick={() => onRemoveFromCart(product.id)}
              className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 cursor-pointer"
            >
              Quitar del carrito
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              disabled={product.stock < 1}
              className="w-full rounded-xl bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800 cursor-pointer disabled:opacity-60"
            >
              {product.stock < 1 ? "Sin stock" : "Agregar al carrito"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}