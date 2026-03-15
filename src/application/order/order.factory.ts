import { MongoOrderRepository } from '../../infrastructure/order/MongoOrderRepository';
import { MongoProductRepository } from '../../infrastructure/product/MongoProductRepository';
import { CancelOrderUseCase } from './cancelOrder.usecase';
import { CreateOrderUseCase } from './createOrder.usecase';
import { GetOrderUseCase } from './getOrder.usecase';
import { ListOrdersUseCase } from './listOrders.usecase';

export const makeCreateOrderUseCase = () =>
  new CreateOrderUseCase(
    new MongoOrderRepository(),
    new MongoProductRepository(),
  );
export const makeGetOrderUseCase = () =>
  new GetOrderUseCase(new MongoOrderRepository());
export const makeListOrdersUseCase = () =>
  new ListOrdersUseCase(new MongoOrderRepository());
export const makeCancelOrderUseCase = () =>
  new CancelOrderUseCase(new MongoOrderRepository());
