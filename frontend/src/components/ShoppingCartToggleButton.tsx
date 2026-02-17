import { memo } from "react";
import { ShoppingCart } from "lucide-react";

type ShoppingCartToggleButtonProps = {
  itemsCount: number;
  isOpen: boolean;
  onToggle: () => void;
};

function ShoppingCartToggleButtonBase({ itemsCount, isOpen, onToggle }: ShoppingCartToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="relative rounded-full p-2 text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
      aria-label="Carrito de compras"
      aria-expanded={isOpen}
    >
      <ShoppingCart className="size-8" />

      {itemsCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-pink-600 px-1 text-sm font-semibold text-white transition-all duration-200">
          {itemsCount > 99 ? "99+" : itemsCount}
        </span>
      )}
    </button>
  );
}

const ShoppingCartToggleButton = memo(ShoppingCartToggleButtonBase);

export default ShoppingCartToggleButton;
