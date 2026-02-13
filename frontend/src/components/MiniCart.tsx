import { useState } from "react";

export default function MiniCart() {
  const [items, setItems] = useState(0);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">Carrito: {items}</span>
      <button
        type="button"
        className="px-2 py-1 rounded bg-slate-900 text-white text-sm hover:bg-slate-800 transition-colors"
        onClick={() => setItems((currentItems) => currentItems + 1)}
      >
        Agregar
      </button>
    </div>
  );
}
