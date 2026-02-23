import { useState, useEffect, type SyntheticEvent } from "react";

import { ProductForm } from "./ProductForm";
import { useProducts } from "./useProducts";
import { emptyFormData } from "./types";
import type { AdminProduct, ProductFormData } from "./types";

type View = "list" | "create" | "edit";

export default function AdminPage() {
  const { products, loading, fetchProducts, createProduct, updateProduct, setProductActive } =
    useProducts();

  const [view, setView] = useState<View>("list");
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const goToList = () => {
    setView("list");
    setEditingProduct(null);
    setFormData(emptyFormData);
    setImageFile(null);
  };

  const goToCreate = () => {
    setFormData(emptyFormData);
    setImageFile(null);
    setEditingProduct(null);
    setView("create");
  };

  const goToEdit = (product: AdminProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description ?? "",
      value: product.value,
      price: product.price,
      stock: String(product.stock),
      isActive: product.isActive,
    });
    setImageFile(null);
    setView("edit");
  };

  const handleCreate = async (e: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
    if (!imageFile) return; // browser `required` prevents this, but guard anyway
    setSubmitting(true);
    const ok = await createProduct(formData, imageFile);
    setSubmitting(false);
    if (ok) goToList();
  };

  const handleUpdate = async (e: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSubmitting(true);
    const ok = await updateProduct(editingProduct.id, formData, imageFile);
    setSubmitting(false);
    if (ok) goToList();
  };

  const handleToggleActive = async (product: AdminProduct) => {
    if (product.isActive && !window.confirm(`¿Desactivar "${product.name}"?`)) return;
    await setProductActive(product, !product.isActive);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto w-full max-w-5xl">
        {view === "list" && (
          <ProductList
            products={products}
            loading={loading}
            onCreate={goToCreate}
            onEdit={goToEdit}
            onToggleActive={handleToggleActive}
          />
        )}

        {view === "create" && (
          <FormPage title="Crear producto" subtitle="Completa los datos del nuevo producto.">
            <ProductForm
              mode="create"
              formData={formData}
              onChange={setFormData}
              imageFile={imageFile}
              onImageChange={setImageFile}
              onSubmit={handleCreate}
              onCancel={goToList}
              submitting={submitting}
            />
          </FormPage>
        )}

        {view === "edit" && editingProduct && (
          <FormPage title="Editar producto" subtitle="Modifica los campos que desees actualizar.">
            <ProductForm
              mode="edit"
              formData={formData}
              onChange={setFormData}
              imageFile={imageFile}
              onImageChange={setImageFile}
              onSubmit={handleUpdate}
              onCancel={goToList}
              submitting={submitting}
              currentProduct={editingProduct}
            />
          </FormPage>
        )}
      </div>
    </main>
  );
}

// ─── Page shell ──────────────────────────────────────────────────────────────

function FormPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
      <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
      {children}
    </section>
  );
}

// ─── Product list ─────────────────────────────────────────────────────────────

function ProductList({
  products,
  loading,
  onCreate,
  onEdit,
  onToggleActive,
}: {
  products: AdminProduct[];
  loading: boolean;
  onCreate: () => void;
  onEdit: (p: AdminProduct) => void;
  onToggleActive: (p: AdminProduct) => void;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Panel admin</h1>
          <p className="mt-1 text-sm text-gray-600">Gestiona los productos del marketplace.</p>
        </div>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          + Crear producto
        </button>
      </div>

      {loading ? (
        <p className="mt-8 text-center text-sm text-gray-500">Cargando productos...</p>
      ) : products.length === 0 ? (
        <p className="mt-8 text-center text-sm text-gray-500">No hay productos. Crea el primero.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="pb-3 pr-4">Imagen</th>
                <th className="pb-3 pr-4">Nombre</th>
                <th className="pb-3 pr-4">Precio venta</th>
                <th className="pb-3 pr-4">Stock</th>
                <th className="pb-3 pr-4">Estado</th>
                <th className="pb-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <ProductRow key={p.id} product={p} onEdit={onEdit} onToggleActive={onToggleActive} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ─── Product row ──────────────────────────────────────────────────────────────

function ProductRow({
  product,
  onEdit,
  onToggleActive,
}: {
  product: AdminProduct;
  onEdit: (p: AdminProduct) => void;
  onToggleActive: (p: AdminProduct) => void;
}) {
  return (
    <tr className="align-middle">
      <td className="py-3 pr-4">
        <img src={product.imageUrl} alt={product.name} className="h-12 w-12 rounded-lg object-cover" />
      </td>
      <td className="py-3 pr-4 font-medium text-gray-900">{product.name}</td>
      <td className="py-3 pr-4 text-gray-700">${parseFloat(product.price).toFixed(2)}</td>
      <td className="py-3 pr-4 text-gray-700">{product.stock}</td>
      <td className="py-3 pr-4">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            product.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {product.isActive ? "Activo" : "Inactivo"}
        </span>
      </td>
      <td className="py-3">
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(product)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Editar
          </button>
          <button
            onClick={() => onToggleActive(product)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              product.isActive
                ? "border-red-200 text-red-600 hover:bg-red-50"
                : "border-green-200 text-green-600 hover:bg-green-50"
            }`}
          >
            {product.isActive ? "Desactivar" : "Activar"}
          </button>
        </div>
      </td>
    </tr>
  );
}
