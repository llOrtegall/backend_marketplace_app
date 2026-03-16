import { MongoOrderRepository } from '../../infrastructure/order/MongoOrderRepository';
import { MongoProductRepository } from '../../infrastructure/product/MongoProductRepository';
import { MongoTransactionManager } from '../../infrastructure/shared/MongoTransactionManager';
import { CancelOrderUseCase } from './cancelOrder.usecase';
import { ConfirmOrderUseCase } from './confirmOrder.usecase';
import { CreateOrderUseCase } from './createOrder.usecase';
import { GetOrderUseCase } from './getOrder.usecase';
import { ListOrdersUseCase } from './listOrders.usecase';

const orderRepo = new MongoOrderRepository();
const productRepo = new MongoProductRepository();
const txManager = new MongoTransactionManager();

export const makeCreateOrderUseCase = () =>
  new CreateOrderUseCase(orderRepo, productRepo, txManager);
export const makeGetOrderUseCase = () => new GetOrderUseCase(orderRepo);
export const makeListOrdersUseCase = () => new ListOrdersUseCase(orderRepo);
export const makeCancelOrderUseCase = () =>
  new CancelOrderUseCase(orderRepo, productRepo, txManager);
export const makeConfirmOrderUseCase = () => new ConfirmOrderUseCase(orderRepo);
