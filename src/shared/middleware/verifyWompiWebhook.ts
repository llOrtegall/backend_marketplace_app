import type { NextFunction, Request, Response } from 'express';
import type { WompiWebhookPayload } from '../../domain/payment/PaymentGateway';
import { AppError, ValidationError } from '../errors/AppError';
import { verifyWompiSignature } from '../utils/wompiSignature';
import { env } from '../../config/env';

export function verifyWompiWebhook(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const rawBody = req.body;
    if (!Buffer.isBuffer(rawBody)) {
      return next(
        new ValidationError('Raw body expected for webhook verification'),
      );
    }
    const payload = JSON.parse(rawBody.toString('utf8')) as WompiWebhookPayload;
    if (payload.event !== 'transaction.updated') {
      // Not a transaction event — acknowledge and skip
      req.body = payload;
      return next();
    }
    const isValid = verifyWompiSignature(payload, env.WOMPI_EVENTS_SECRET);
    if (!isValid) {
      return next(
        new AppError(
          'WEBHOOK_INVALID_SIGNATURE',
          'Invalid webhook signature',
          401,
        ),
      );
    }
    req.body = payload;
    next();
  } catch {
    next(new ValidationError('Invalid webhook payload'));
  }
}
