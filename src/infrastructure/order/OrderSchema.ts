import { Schema, model } from 'mongoose';
import type { OrderStatus } from '../../domain/order/OrderValueObjects';

export interface OrderItemDocument {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderDocument {
  _id: string;
  buyerId: string;
  items: OrderItemDocument[];
  total: number;
  status: OrderStatus;
  paymentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<OrderItemDocument>(
  {
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    subtotal: { type: Number, required: true },
  },
  { _id: false },
);

const orderSchema = new Schema<OrderDocument>(
  {
    _id: { type: String, required: true },
    buyerId: { type: String, required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'AWAITING_PAYMENT', 'CONFIRMED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    paymentId: { type: String, default: null },
  },
  { timestamps: true, _id: false },
);

orderSchema.index({ buyerId: 1, status: 1 });
orderSchema.index({ buyerId: 1, createdAt: -1 });

export const OrderModel = model<OrderDocument>('Order', orderSchema);
