import { useState, useCallback } from "react";
import { toast } from "sonner";
import axios from "axios";
import type { AdminProduct, ProductFormData } from "./types";

function buildPayload(formData: ProductFormData, imageFile?: File | null): FormData {
  const payload = new FormData();
  payload.append("name", formData.name);
  payload.append("description", formData.description);
  payload.append("value", formData.value);
  payload.append("price", formData.price);
  payload.append("stock", formData.stock);
  payload.append("isActive", String(formData.isActive));
  if (imageFile) payload.append("image", imageFile);
  return payload;
}

const MULTIPART = { headers: { "Content-Type": "multipart/form-data" } };

export function useProducts() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get<{ data: AdminProduct[] }>("/products");
      setProducts(res.data.data);
    } catch {
      toast.error("No se pudieron cargar los productos.");
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = async (formData: ProductFormData, imageFile: File): Promise<boolean> => {
    try {
      await axios.post("/products", buildPayload(formData, imageFile), MULTIPART);
      toast.success("Producto creado correctamente.");
      await fetchProducts();
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Error al crear el producto.");
      return false;
    }
  };

  const updateProduct = async (
    id: string,
    formData: ProductFormData,
    imageFile: File | null,
  ): Promise<boolean> => {
    try {
      await axios.put(`/products/${id}`, buildPayload(formData, imageFile), MULTIPART);
      toast.success("Producto actualizado correctamente.");
      await fetchProducts();
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Error al actualizar el producto.");
      return false;
    }
  };

  const setProductActive = async (product: AdminProduct, isActive: boolean): Promise<void> => {
    // Only send the minimum fields required by the backend schema
    const payload = buildPayload(
      { name: product.name, description: "", value: product.value, price: product.price, stock: String(product.stock), isActive },
    );
    try {
      await axios.put(`/products/${product.id}`, payload, MULTIPART);
      toast.success(`Producto ${isActive ? "activado" : "desactivado"}.`);
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, isActive } : p)));
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Error al actualizar el producto.");
    }
  };

  return { products, loading, fetchProducts, createProduct, updateProduct, setProductActive };
}
