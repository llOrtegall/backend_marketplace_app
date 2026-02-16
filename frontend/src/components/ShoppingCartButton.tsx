import { ShoppingCart } from "lucide-react";

type ShoppingCartButtonProps = {
  itemsCount: number;
};

export default function ShoppingCartButton({ itemsCount }: ShoppingCartButtonProps) {
  return (
    <button
      type="button"
      className="relative rounded-full p-2 text-gray-700 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
      aria-label="Carrito de compras"
    >
      <ShoppingCart className="size-8" />

      {itemsCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-black px-1.5 text-[10px] font-semibold text-white">
          {itemsCount > 99 ? "99+" : itemsCount}
        </span>
      )}
    </button>
  );
}