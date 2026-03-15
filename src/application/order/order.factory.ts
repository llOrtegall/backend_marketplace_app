import { MongoOrderRepository } from '../../infrastructure/order/MongoOrderRepository';
import { MongoProductRepository } from '../../infrastructure/product/MongoProductRepository';
import { CancelOrderUseCase } from './cancelOrder.usecase';
import { CreateOrderUseCase } from './createOrder.usecase';
import { GetOrderUseCase } from './getOrder.usecase';
import { ListOrdersUseCase } from './listOrders.usecase';

const orderRepo = new MongoOrderRepository();
const productRepo = new MongoProductRepository();

export const makeCreateOrderUseCase = () =>
  new CreateOrderUseCase(orderRepo, productRepo);
export const makeGetOrderUseCase = () => new GetOrderUseCase(orderRepo);
export const makeListOrdersUseCase = () => new ListOrdersUseCase(orderRepo);
export const makeCancelOrderUseCase = () => new CancelOrderUseCase(orderRepo);
