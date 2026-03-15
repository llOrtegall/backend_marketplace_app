import type { NextFunction, Request, Response } from 'express';
import {
  makeGetPaymentUseCase,
  makeHandleWompiEventUseCase,
  makeInitiatePaymentUseCase,
} from '../../application/payment/payment.factory';
import type { WompiWebhookPayload } from '../../domain/payment/PaymentGateway';
import { requireAuth } from '../../shared/middleware/authenticate';
import type { InitiatePaymentBody } from './payment.schemas';
import { toPaymentDTO } from './payment.types';

export async function initiatePayment(
  req: Request<object, object, InitiatePaymentBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { sub: buyerId } = requireAuth(req);
    const payment = await makeInitiatePaymentUseCase().execute({
      ...req.body,
      buyerId,
    });
    res.status(201).json({ success: true, data: toPaymentDTO(payment) });
  } catch (err) {
    next(err);
  }
}

export async function handleWompiWebhook(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payload = req.body as WompiWebhookPayload;
    await makeHandleWompiEventUseCase().execute(payload.data.transaction);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function getPayment(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { sub: requesterId, role: requesterRole } = requireAuth(req);
    const payment = await makeGetPaymentUseCase().execute({
      paymentId: req.params.id,
      requesterId,
      requesterRole,
    });
    res.json({ success: true, data: toPaymentDTO(payment) });
  } catch (err) {
    next(err);
  }
}
