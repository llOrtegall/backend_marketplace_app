import { createHash } from 'node:crypto';
import type { WompiWebhookPayload } from '../../domain/payment/PaymentGateway';

export function verifyWompiSignature(
  payload: WompiWebhookPayload,
  eventSecret: string,
): boolean {
  const tx = payload.data.transaction;
  const valuesString = payload.signature.properties
    .map((prop) => {
      const fieldPath = prop.startsWith('transaction.')
        ? prop.slice('transaction.'.length)
        : prop;
      const value = tx[fieldPath];
      return value !== undefined && value !== null ? String(value) : '';
    })
    .join('');
  const raw = `${valuesString}${payload.timestamp}${eventSecret}`;
  const hash = createHash('sha256').update(raw, 'utf8').digest('hex');
  return hash === payload.signature.checksum;
}

export function buildWompiIntegritySignature(
  reference: string,
  amountInCents: number,
  integritySecret: string,
): string {
  const raw = `${reference}${amountInCents}COP${integritySecret}`;
  return createHash('sha256').update(raw, 'utf8').digest('hex');
}
