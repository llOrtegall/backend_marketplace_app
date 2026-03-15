import { AppError } from '../../shared/errors/AppError';
import {
  TERMINAL_PAYMENT_STATUSES,
  WOMPI_TO_DOMAIN_STATUS,
  type PaymentMethod,
  type PaymentStatus,
  type WompiTransactionStatus,
} from './PaymentValueObjects';

export interface PaymentProps {
  id: string;
  orderId: string;
  buyerId: string;
  amountCOP: number;
  method: PaymentMethod;
  status: PaymentStatus;
  wompiTransactionId: string | null;
  wompiRedirectUrl: string | null;
  failureReason: string | null;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentInput {
  id: string;
  orderId: string;
  buyerId: string;
  amountCOP: number;
  method: PaymentMethod;
}

export interface WompiEventInput {
  wompiTransactionId: string;
  wompiStatus: WompiTransactionStatus;
  redirectUrl?: string | null;
  failureReason?: string | null;
}

export class Payment {
  private constructor(private readonly props: PaymentProps) {}

  static create(input: CreatePaymentInput): Payment {
    const now = new Date();
    return new Payment({
      ...input,
      status: 'INITIATED',
      wompiTransactionId: null,
      wompiRedirectUrl: null,
      failureReason: null,
      processedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: PaymentProps): Payment {
    return new Payment(props);
  }

  applyWompiEvent(input: WompiEventInput): Payment {
    if (this.isTerminal())
      throw new AppError(
        'PAYMENT_ALREADY_TERMINAL',
        `Payment '${this.props.id}' is already in terminal state '${this.props.status}'`,
        422,
      );
    const newStatus = WOMPI_TO_DOMAIN_STATUS[input.wompiStatus];
    const isNowTerminal = TERMINAL_PAYMENT_STATUSES.has(newStatus);
    return new Payment({
      ...this.props,
      status: newStatus,
      wompiTransactionId: input.wompiTransactionId,
      wompiRedirectUrl: input.redirectUrl ?? this.props.wompiRedirectUrl,
      failureReason: input.failureReason ?? this.props.failureReason,
      processedAt: isNowTerminal ? new Date() : this.props.processedAt,
      updatedAt: new Date(),
    });
  }

  isTerminal(): boolean {
    return TERMINAL_PAYMENT_STATUSES.has(this.props.status);
  }
  isApproved(): boolean {
    return this.props.status === 'APPROVED';
  }

  get id() {
    return this.props.id;
  }
  get orderId() {
    return this.props.orderId;
  }
  get buyerId() {
    return this.props.buyerId;
  }
  get amountCOP() {
    return this.props.amountCOP;
  }
  get method() {
    return this.props.method;
  }
  get status() {
    return this.props.status;
  }
  get wompiTransactionId() {
    return this.props.wompiTransactionId;
  }
  get wompiRedirectUrl() {
    return this.props.wompiRedirectUrl;
  }
  get failureReason() {
    return this.props.failureReason;
  }
  get processedAt() {
    return this.props.processedAt;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
}
