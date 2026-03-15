export type PaymentStatus =
  | 'INITIATED'
  | 'PENDING'
  | 'APPROVED'
  | 'DECLINED'
  | 'VOIDED'
  | 'ERROR';

export const TERMINAL_PAYMENT_STATUSES: ReadonlySet<PaymentStatus> = new Set([
  'APPROVED',
  'DECLINED',
  'VOIDED',
  'ERROR',
]);

export type WompiTransactionStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'DECLINED'
  | 'VOIDED'
  | 'ERROR';

export const WOMPI_TO_DOMAIN_STATUS: Record<
  WompiTransactionStatus,
  PaymentStatus
> = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  DECLINED: 'DECLINED',
  VOIDED: 'VOIDED',
  ERROR: 'ERROR',
};

export type PaymentMethod =
  | 'CARD'
  | 'BANCOLOMBIA_TRANSFER'
  | 'NEQUI'
  | 'PSE'
  | 'BANCOLOMBIA_QR'
  | 'DAVIPLATA';
