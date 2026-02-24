import type { ChangeEvent, SyntheticEvent } from "react";
import type { AdminProduct, ProductFormData } from "./types";

type Props = {
  mode: "create" | "edit";
  formData: ProductFormData;
  onChange: (data: ProductFormData) => void;
  imageFile: File | null;
  onImageChange: (file: File | null) => void;
  onSubmit: (e: SyntheticEvent<HTMLFormElement, SubmitEvent>) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
  currentProduct?: AdminProduct;
};

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-black";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

export function ProductForm({
  mode,
  formData,
  onChange,
  imageFile,
  onImageChange,
  onSubmit,
  onCancel,
  submitting,
  currentProduct,
}: Props) {
  const set = (partial: Partial<ProductFormData>) => onChange({ ...formData, ...partial });

  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-5">
      <Field label="Nombre">
        <input
          type="text"
          value={formData.name}
          onChange={(e) => set({ name: e.target.value })}
          className={inputClass}
          required
        />
      </Field>

      <Field label="Descripción">
        <textarea
          value={formData.description}
          onChange={(e) => set({ description: e.target.value })}
          className={`min-h-24 ${inputClass}`}
        />
      </Field>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Precio venta">
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => set({ price: e.target.value })}
            className={inputClass}
            required
          />
        </Field>
        <Field label="Precio costo">
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.value}
            onChange={(e) => set({ value: e.target.value })}
            className={inputClass}
            required
          />
        </Field>
      </div>

      <Field label="Stock">
        <input
          type="number"
          min="0"
          value={formData.stock}
          onChange={(e) => set({ stock: e.target.value })}
          className={inputClass}
          required
        />
      </Field>

      <Field label="Imagen del producto">
        <div className="grid gap-1">
          {mode === "edit" && currentProduct && !imageFile && (
            <img
              src={currentProduct.imageUrl}
              alt="Imagen actual"
              className="mb-1 h-20 w-20 rounded-lg object-cover"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onImageChange(e.target.files?.[0] ?? null)
            }
            className={`${inputClass} file:mr-4 file:rounded-lg file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-black`}
            required={mode === "create"}
          />
          <p className="text-xs text-gray-500">
            {mode === "edit"
              ? "Deja vacío para mantener la imagen actual. Máx. 5 MB."
              : "Máximo 5 MB. Formatos: JPG, PNG, WEBP."}
          </p>
        </div>
      </Field>

      <label className="inline-flex cursor-pointer items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) => set({ isActive: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300"
        />
        Producto activo
      </label>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Guardando..." : mode === "create" ? "Crear producto" : "Guardar cambios"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
