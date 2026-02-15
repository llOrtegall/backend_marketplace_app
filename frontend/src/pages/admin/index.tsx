import { useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().positive("Price must be positive"),
  stock: z.number().int().min(0, "Stock must be non-negative"),
  isActive: z.boolean()
});

export default function AdminPage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    isActive: true
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      productSchema.parse(formData);
      setLoading(true);
      await axios.post('http://localhost:3000/api/v1/products', formData);
      toast.success('Product added successfully!');
      setFormData({ name: '', description: '', price: 0, stock: 0, isActive: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log(error);
      } else {
        toast.error('Failed to add product. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Panel admin</h1>
      <p className="mt-2 text-gray-600">Acceso autorizado para usuarios con rol administrador.</p>


      <section>
        <h2 className="text-xl font-semibold mt-6">Gestión de productos</h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" rows={3} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Price</label>
            <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Stock</label>
            <input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" required />
          </div>
          <div className="flex items-center">
            <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
            <label className="ml-2 block text-sm text-gray-900">Is Active</label>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Adding Product...' : 'Add Product'}
          </button>
        </form>
      </section>
    </main>
  );
}