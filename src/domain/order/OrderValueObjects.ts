import { UnprocessableError } from '../../shared/errors/AppError';

export type OrderStatus =
  | 'PENDING'
  | 'AWAITING_PAYMENT'
  | 'CONFIRMED'
  | 'CANCELLED';

export const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['AWAITING_PAYMENT', 'CANCELLED'],
  AWAITING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: [],
  CANCELLED: [],
};

export class Money {
  private constructor(readonly value: number) {}
  static create(value: number): Money {
    if (value <= 0)
      throw new UnprocessableError(
        'ORDER_INVALID_AMOUNT',
        'Amount must be greater than 0',
      );
    if (Math.round(value * 100) / 100 !== value)
      throw new UnprocessableError(
        'ORDER_INVALID_AMOUNT',
        'Amount must have at most 2 decimal places',
      );
    return new Money(value);
  }
  static fromPersistence(value: number): Money {
    return new Money(value);
  }
}

export class Quantity {
  private constructor(readonly value: number) {}
  static create(value: number): Quantity {
    if (!Number.isInteger(value) || value < 1)
      throw new UnprocessableError(
        'ORDER_INVALID_QUANTITY',
        'Quantity must be a positive integer',
      );
    return new Quantity(value);
  }
  static fromPersistence(value: number): Quantity {
    return new Quantity(value);
  }
}

export interface OrderItemProps {
  productId: string;
  productName: string;
  unitPrice: Money;
  quantity: Quantity;
  subtotal: Money;
}

export interface OrderItemCreateInput {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export class OrderItem {
  private constructor(private readonly props: OrderItemProps) {}
  static create(input: OrderItemCreateInput): OrderItem {
    const unitPrice = Money.create(input.unitPrice);
    const quantity = Quantity.create(input.quantity);
    const subtotal = Money.fromPersistence(
      Math.round(input.unitPrice * input.quantity * 100) / 100,
    );
    return new OrderItem({
      productId: input.productId,
      productName: input.productName,
      unitPrice,
      quantity,
      subtotal,
    });
  }
  static fromPersistence(props: OrderItemProps): OrderItem {
    return new OrderItem(props);
  }
  get productId() {
    return this.props.productId;
  }
  get productName() {
    return this.props.productName;
  }
  get unitPrice() {
    return this.props.unitPrice.value;
  }
  get quantity() {
    return this.props.quantity.value;
  }
  get subtotal() {
    return this.props.subtotal.value;
  }
}
