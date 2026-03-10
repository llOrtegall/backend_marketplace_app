import type { NextFunction, Request, Response } from 'express';
import {
  makeCreateProductUseCase,
  makeDeleteProductUseCase,
  makeGetProductUseCase,
  makeListProductsUseCase,
  makeUpdateProductUseCase,
} from '../../application/product/product.factory';
import type { CreateProductBody, UpdateProductBody } from './product.schemas';
import { toProductDTO } from './product.types';

export async function createProduct(
  req: Request<object, object, CreateProductBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const sellerId = req.auth!.sub;
    const product = await makeCreateProductUseCase().execute({
      ...req.body,
      sellerId,
    });
    res.status(201).json({ success: true, data: toProductDTO(product) });
  } catch (err) {
    next(err);
  }
}

export async function getProduct(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const product = await makeGetProductUseCase().execute(req.params.id);
    res.json({ success: true, data: toProductDTO(product) });
  } catch (err) {
    next(err);
  }
}

export async function listProducts(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { page, limit, sortBy, order, ...filters } = req.query as any;
    const result = await makeListProductsUseCase().execute({
      filters,
      pagination: { page, limit, sortBy, order },
    });
    res.json({
      success: true,
      data: result.items.map(toProductDTO),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(
  req: Request<{ id: string }, object, UpdateProductBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const product = await makeUpdateProductUseCase().execute({
      productId: req.params.id,
      requesterId: req.auth!.sub,
      ...req.body,
    });
    res.json({ success: true, data: toProductDTO(product) });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await makeDeleteProductUseCase().execute({
      productId: req.params.id,
      requesterId: req.auth!.sub,
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
