import type { NextFunction, Request, Response } from 'express';
import {
  makeCancelOrderUseCase,
  makeCreateOrderUseCase,
  makeGetOrderUseCase,
  makeListOrdersUseCase,
} from '../../application/order/order.factory';
import { requireAuth } from '../../shared/middleware/authenticate';
import type { CreateOrderBody, ListOrdersQuery } from './order.schemas';
import { toOrderDTO } from './order.types';

export async function createOrder(
  req: Request<object, object, CreateOrderBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { sub: buyerId } = requireAuth(req);
    const order = await makeCreateOrderUseCase().execute({
      buyerId,
      items: req.body.items,
    });
    res.status(201).json({ success: true, data: toOrderDTO(order) });
  } catch (err) {
    next(err);
  }
}

export async function getOrder(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { sub: requesterId, role: requesterRole } = requireAuth(req);
    const order = await makeGetOrderUseCase().execute({
      orderId: req.params.id,
      requesterId,
      requesterRole,
    });
    res.json({ success: true, data: toOrderDTO(order) });
  } catch (err) {
    next(err);
  }
}

export async function listOrders(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { sub: requesterId, role: requesterRole } = requireAuth(req);
    const { page, limit, status } = req.query as unknown as ListOrdersQuery;
    const result = await makeListOrdersUseCase().execute({
      requesterId,
      requesterRole,
      status,
      page,
      limit,
    });
    res.json({
      success: true,
      data: result.items.map(toOrderDTO),
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

export async function cancelOrder(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { sub: requesterId, role: requesterRole } = requireAuth(req);
    await makeCancelOrderUseCase().execute({
      orderId: req.params.id,
      requesterId,
      requesterRole,
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
