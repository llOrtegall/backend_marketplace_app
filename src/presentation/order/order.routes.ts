import { Router } from 'express';
import { authenticate } from '../../shared/middleware/middlewareInstances';
import { validate } from '../../shared/middleware/validate';
import {
  cancelOrder,
  createOrder,
  getOrder,
  listOrders,
} from './order.controller';
import { createOrderSchema, listOrdersQuerySchema } from './order.schemas';

export const orderRouter = Router();

orderRouter.post('/', authenticate, validate(createOrderSchema), createOrder);
orderRouter.get(
  '/',
  authenticate,
  validate(listOrdersQuerySchema, 'query'),
  listOrders,
);
orderRouter.get('/:id', authenticate, getOrder);
orderRouter.patch('/:id/cancel', authenticate, cancelOrder);
