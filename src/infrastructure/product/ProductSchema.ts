import { Schema, model } from 'mongoose';

export interface ProductDocument {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  sellerId: string;
  status: 'active' | 'inactive' | 'deleted';
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<ProductDocument>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    category: { type: String, required: true, index: true },
    images: [{ type: String }],
    sellerId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['active', 'inactive', 'deleted'],
      default: 'active',
      index: true,
    },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    _id: false,
  },
);

productSchema.index({ sellerId: 1, status: 1 });
productSchema.index({ category: 1, status: 1, price: 1 });
productSchema.index({ status: 1, createdAt: -1, _id: -1 });

export const ProductModel = model<ProductDocument>('Product', productSchema);
