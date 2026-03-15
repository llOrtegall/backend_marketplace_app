import { AppError } from '../../shared/errors/AppError';
import {
  Money,
  OrderItem,
  type OrderItemCreateInput,
  type OrderStatus,
  VALID_ORDER_TRANSITIONS,
} from './OrderValueObjects';

export interface OrderProps {
  id: string;
  buyerId: string;
  items: OrderItem[];
  total: Money;
  status: OrderStatus;
  paymentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderInput {
  id: string;
  buyerId: string;
  items: OrderItemCreateInput[];
}

export class Order {
  private constructor(private readonly props: OrderProps) {}

  static create(input: CreateOrderInput): Order {
    const items = input.items.map((i) => OrderItem.create(i));
    const rawTotal = items.reduce((acc, item) => acc + item.subtotal, 0);
    const total = Money.fromPersistence(Math.round(rawTotal * 100) / 100);
    const now = new Date();
    return new Order({
      id: input.id,
      buyerId: input.buyerId,
      items,
      total,
      status: 'PENDING',
      paymentId: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: OrderProps): Order {
    return new Order(props);
  }

  linkPayment(paymentId: string): Order {
    if (this.props.paymentId !== null)
      throw new AppError(
        'ORDER_PAYMENT_ALREADY_LINKED',
        'Order already has a payment linked',
        422,
      );
    return new Order({ ...this.props, paymentId, updatedAt: new Date() });
  }

  transitionTo(target: OrderStatus): Order {
    const allowed = VALID_ORDER_TRANSITIONS[this.props.status];
    if (!allowed.includes(target))
      throw new AppError(
        'ORDER_INVALID_TRANSITION',
        `Cannot transition order from '${this.props.status}' to '${target}'`,
        422,
      );
    return new Order({ ...this.props, status: target, updatedAt: new Date() });
  }

  cancel(): Order {
    return this.transitionTo('CANCELLED');
  }
  confirm(): Order {
    return this.transitionTo('CONFIRMED');
  }
  isOwnedBy(buyerId: string): boolean {
    return this.props.buyerId === buyerId;
  }

  get id() {
    return this.props.id;
  }
  get buyerId() {
    return this.props.buyerId;
  }
  get items() {
    return this.props.items;
  }
  get total() {
    return this.props.total.value;
  }
  get status() {
    return this.props.status;
  }
  get paymentId() {
    return this.props.paymentId;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
}
