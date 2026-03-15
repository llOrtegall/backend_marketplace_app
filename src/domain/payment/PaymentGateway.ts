import type {
  PaymentMethod,
  WompiTransactionStatus,
} from './PaymentValueObjects';

export interface CustomerData {
  fullName: string;
  phoneNumber?: string;
  phoneNumberPrefix?: string;
  legalId?: string;
  legalIdType?: string;
}

export interface InitiatePaymentGatewayInput {
  paymentId: string;
  amountCOP: number;
  customerEmail: string;
  method: PaymentMethod;
  acceptanceToken: string;
  personalDataAuthToken: string;
  paymentMethodData?: Record<string, unknown>;
  redirectUrl?: string;
  customerData?: CustomerData;
  ipAddress?: string;
}

export interface InitiatePaymentGatewayResult {
  wompiTransactionId: string;
  wompiStatus: WompiTransactionStatus;
  redirectUrl: string | null;
}

export interface WompiWebhookPayload {
  event: string;
  data: { transaction: WompiTransactionData };
  environment: 'prod' | 'test';
  signature: { properties: string[]; checksum: string };
  timestamp: number;
}

export interface WompiTransactionData {
  id: string;
  status: WompiTransactionStatus;
  reference: string;
  amount_in_cents: number;
  currency: string;
  payment_method_type: string;
  [key: string]: unknown;
}

export interface IPaymentGateway {
  initiatePayment(
    input: InitiatePaymentGatewayInput,
  ): Promise<InitiatePaymentGatewayResult>;
}
