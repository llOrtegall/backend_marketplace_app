import { MongoOrderRepository } from '../../infrastructure/order/MongoOrderRepository';
import { MongoPaymentRepository } from '../../infrastructure/payment/MongoPaymentRepository';
import { WompiGateway } from '../../infrastructure/payment/WompiGateway';
import { MongoProductRepository } from '../../infrastructure/product/MongoProductRepository';
import { MongoTransactionManager } from '../../infrastructure/shared/MongoTransactionManager';
import { MongoUserRepository } from '../../infrastructure/user/MongoUserRepository';
import { GetPaymentUseCase } from './getPayment.usecase';
import { HandleWompiEventUseCase } from './handleWompiEvent.usecase';
import { InitiatePaymentUseCase } from './initiatePayment.usecase';

const orderRepo = new MongoOrderRepository();
const paymentRepo = new MongoPaymentRepository();
const productRepo = new MongoProductRepository();
const userRepo = new MongoUserRepository();
const wompiGateway = new WompiGateway();
const txManager = new MongoTransactionManager();

export const makeInitiatePaymentUseCase = () =>
  new InitiatePaymentUseCase(
    orderRepo,
    paymentRepo,
    wompiGateway,
    userRepo,
    txManager,
  );

export const makeHandleWompiEventUseCase = () =>
  new HandleWompiEventUseCase(paymentRepo, orderRepo, productRepo, txManager);

export const makeGetPaymentUseCase = () => new GetPaymentUseCase(paymentRepo);
