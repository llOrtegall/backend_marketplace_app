import { AppError } from '../../shared/errors/AppError';
import { buildWompiIntegritySignature } from '../../shared/utils/wompiSignature';
import { env } from '../../config/env';
import type {
  IPaymentGateway,
  InitiatePaymentGatewayInput,
  InitiatePaymentGatewayResult,
} from '../../domain/payment/PaymentGateway';
import type { WompiTransactionStatus } from '../../domain/payment/PaymentValueObjects';

export class WompiGateway implements IPaymentGateway {
  async initiatePayment(
    input: InitiatePaymentGatewayInput,
  ): Promise<InitiatePaymentGatewayResult> {
    const amountInCents = Math.round(input.amountCOP * 100);
    const signature = buildWompiIntegritySignature(
      input.paymentId,
      amountInCents,
      env.WOMPI_INTEGRITY_SECRET,
    );

    const paymentMethod: Record<string, unknown> = {
      type: input.method,
      ...(input.paymentMethodData ?? {}),
    };

    const body: Record<string, unknown> = {
      acceptance_token: input.acceptanceToken,
      accept_personal_auth: input.personalDataAuthToken,
      amount_in_cents: amountInCents,
      currency: 'COP',
      customer_email: input.customerEmail,
      payment_method: paymentMethod,
      reference: input.paymentId,
      signature,
    };

    if (input.redirectUrl) body.redirect_url = input.redirectUrl;
    if (input.ipAddress) body.ip = input.ipAddress;
    if (input.customerData) {
      body.customer_data = {
        full_name: input.customerData.fullName,
        ...(input.customerData.phoneNumber && {
          phone_number: input.customerData.phoneNumber,
        }),
        ...(input.customerData.phoneNumberPrefix && {
          phone_number_prefix: input.customerData.phoneNumberPrefix,
        }),
        ...(input.customerData.legalId && {
          legal_id: input.customerData.legalId,
        }),
        ...(input.customerData.legalIdType && {
          legal_id_type: input.customerData.legalIdType,
        }),
      };
    }

    const response = await fetch(`${env.WOMPI_BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.WOMPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = (await response.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      throw new AppError(
        'WOMPI_ERROR',
        `Wompi API error: ${JSON.stringify(err)}`,
        502,
      );
    }

    const result = (await response.json()) as {
      data: { id: string; status: string; redirect_url?: string };
    };
    return {
      wompiTransactionId: result.data.id,
      wompiStatus: result.data.status as WompiTransactionStatus,
      redirectUrl: result.data.redirect_url ?? null,
    };
  }
}
