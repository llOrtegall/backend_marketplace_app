import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/contexts/CartContext";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import axios from "axios";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string;
  stock: number;
  isActive: boolean;
};

export default function Home() {
  const { addToCart, removeFromCart, isInCart, isCartLoading } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  useEffect(() => {
    const authStatus = searchParams.get("auth");

    if (!authStatus) {
      return;
    }

    if (authStatus === "success") {
      toast.success("¡Bienvenido!", { id: "auth-feedback" });
    } else if (authStatus === "cancelled") {
      toast.error("Inicio con Google cancelado.", { id: "auth-feedback" });
    } else {
      toast.error("No se pudo completar la autenticación.", { id: "auth-feedback" });
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("auth");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoadingProducts(true);
        setProductsError(null);

        const response = await axios.get<{ data: Product[] }>("/products");
        const activeProducts = response.data.data.filter((product) => product.isActive);
        setProducts(activeProducts);
      } catch {
        setProductsError("No se pudieron cargar los productos.");
      } finally {
        setIsLoadingProducts(false);
      }
    };

    void fetchProducts();
  }, []);

  const hasProducts = useMemo(() => products.length > 0, [products.length]);

  const handleAddToCart = async (product: Product) => {
    const success = await addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      stock: product.stock,
    });

    if (success) {
      toast.success("Producto agregado al carrito", { position: "bottom-center" });
      return;
    }

    toast.error("No hay más stock disponible para este producto", { position: "bottom-center" });
  };

  const handleRemoveFromCart = async (productId: string) => {
    const success = await removeFromCart(productId);

    if (success) {
      toast.success("Producto removido del carrito", { position: "bottom-center" });
      return;
    }

    toast.error("No se pudo remover el producto del carrito", { position: "bottom-center" });
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Productos</h1>
        <p className="mt-2 text-sm text-gray-600">Explora el catálogo disponible en tienda.</p>
      </div>

      {isLoadingProducts && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <article key={index} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <div className="aspect-square animate-pulse bg-gray-100" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-gray-100" />
              </div>
            </article>
          ))}
        </div>
      )}

      {!isLoadingProducts && productsError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {productsError}
        </div>
      )}

      {!isLoadingProducts && !productsError && !hasProducts && (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-600">
          No hay productos disponibles por ahora.
        </div>
      )}

      {!isLoadingProducts && !productsError && hasProducts && (
        <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isInCart={isInCart(product.id)}
              isCartLoading={isCartLoading}
              onAddToCart={handleAddToCart}
              onRemoveFromCart={handleRemoveFromCart}
            />
          ))}
        </div>
      )}
    </main>
  );
}
