import { useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import axios from "axios";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().positive("Price must be positive"),
  stock: z.number().int().min(0, "Stock must be non-negative"),
  isActive: z.boolean(),
});

export default function AdminPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    isActive: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!imageFile) {
      toast.error("Product image is required");
      return;
    }

    try {
      productSchema.parse(formData);

      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("description", formData.description);
      payload.append("price", String(formData.price));
      payload.append("stock", String(formData.stock));
      payload.append("isActive", String(formData.isActive));
      payload.append("image", imageFile);

      setLoading(true);
      await axios.post("/products", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Product added successfully!");
      setFormData({ name: "", description: "", price: 0, stock: 0, isActive: true });
      setImageFile(null);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0]?.message ?? "Invalid product data");
      } else {
        toast.error("Failed to add product. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Panel admin</h1>
        <p className="mt-2 text-sm text-gray-600">Crea productos con imagen privada en Cloudflare R2.</p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
          <div className="grid gap-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">Nombre</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-black"
              required
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="description" className="text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="min-h-28 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-black"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="grid gap-2">
              <label htmlFor="price" className="text-sm font-medium text-gray-700">Precio</label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-black"
                required
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="stock" className="text-sm font-medium text-gray-700">Stock</label>
              <input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-black"
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label htmlFor="image" className="text-sm font-medium text-gray-700">Imagen del producto</label>
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setImageFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-black"
              required
            />
            <p className="text-xs text-gray-500">Máximo 5MB. Formatos recomendados: JPG, PNG, WEBP.</p>
          </div>

          <label className="inline-flex items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            Producto activo
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creando producto..." : "Crear producto"}
          </button>
        </form>
      </section>
    </main>
  );
}