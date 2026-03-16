import type { NextFunction, Request, Response } from 'express';
import {
  makeCreateProductUseCase,
  makeDeleteProductUseCase,
  makeGetProductUseCase,
  makeListProductsUseCase,
  makeUpdateProductUseCase,
} from '../../application/product/product.factory';
import type {
  CreateProductBody,
  ListProductsQuery,
  UpdateProductBody,
} from './product.schemas';
import { requireAuth } from '../../shared/middleware/authenticate';
import { toProductDTO } from './product.types';

export async function createProduct(
  req: Request<object, object, CreateProductBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { sub: sellerId } = requireAuth(req);
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
    const product = await makeGetProductUseCase().execute(req.params.id, {
      requesterId: req.auth?.sub,
      requesterRole: req.auth?.role,
    });
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
    const { page, limit, sortBy, order, cursor, ...filters } =
      req.query as unknown as ListProductsQuery;
    const result = await makeListProductsUseCase().execute({
      filters,
      pagination: { page, limit, sortBy, order, cursor },
      requesterId: req.auth?.sub,
      requesterRole: req.auth?.role,
    });
    res.json({
      success: true,
      data: result.items.map(toProductDTO),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        ...(result.nextCursor !== undefined && {
          nextCursor: result.nextCursor,
        }),
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
    const { sub: requesterId } = requireAuth(req);
    const product = await makeUpdateProductUseCase().execute({
      productId: req.params.id,
      requesterId,
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
    const { sub: requesterId } = requireAuth(req);
    await makeDeleteProductUseCase().execute({
      productId: req.params.id,
      requesterId,
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
