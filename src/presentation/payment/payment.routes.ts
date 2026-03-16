import express, { Router } from 'express';
import { authenticate } from '../../shared/middleware/middlewareInstances';
import { validate } from '../../shared/middleware/validate';
import {
  getPayment,
  handleWompiWebhook,
  initiatePayment,
} from './payment.controller';
import { initiatePaymentSchema } from './payment.schemas';
import { verifyWompiWebhook } from '../../shared/middleware/verifyWompiWebhook';

export const paymentRouter = Router();

// NOTE: /webhook must be registered BEFORE /:id so Express doesn't match "webhook" as an :id param
paymentRouter.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  verifyWompiWebhook,
  handleWompiWebhook,
);
paymentRouter.post(
  '/initiate',
  authenticate,
  validate(initiatePaymentSchema),
  initiatePayment,
);
paymentRouter.get('/:id', authenticate, getPayment);
