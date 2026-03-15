import { z } from 'zod';

export const initiatePaymentSchema = z.object({
  orderId: z.string().uuid(),
  method: z.enum([
    'CARD',
    'BANCOLOMBIA_TRANSFER',
    'NEQUI',
    'PSE',
    'BANCOLOMBIA_QR',
    'DAVIPLATA',
  ]),
  acceptanceToken: z.string().min(1),
  personalDataAuthToken: z.string().min(1),
  paymentMethodData: z.record(z.string(), z.unknown()).optional(),
  redirectUrl: z.string().url().optional(),
  customerData: z
    .object({
      fullName: z.string().min(1),
      phoneNumber: z.string().optional(),
      phoneNumberPrefix: z.string().optional(),
      legalId: z.string().optional(),
      legalIdType: z.string().optional(),
    })
    .optional(),
  ipAddress: z.string().optional(),
});

export type InitiatePaymentBody = z.infer<typeof initiatePaymentSchema>;
