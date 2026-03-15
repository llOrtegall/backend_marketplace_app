import { Router } from 'express';
import {
  authenticate,
  optionalAuthenticate,
} from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from './product.controller';
import {
  createProductSchema,
  listProductsQuerySchema,
  updateProductSchema,
} from './product.schemas';

export const productRouter = Router();

productRouter.get(
  '/',
  optionalAuthenticate,
  validate(listProductsQuerySchema, 'query'),
  listProducts,
);
productRouter.get('/:id', optionalAuthenticate, getProduct);
productRouter.post(
  '/',
  authenticate,
  validate(createProductSchema),
  createProduct,
);
productRouter.patch(
  '/:id',
  authenticate,
  validate(updateProductSchema),
  updateProduct,
);
productRouter.delete('/:id', authenticate, deleteProduct);
