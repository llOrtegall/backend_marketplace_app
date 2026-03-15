import { MongoOrderRepository } from '../../infrastructure/order/MongoOrderRepository';
import { MongoPaymentRepository } from '../../infrastructure/payment/MongoPaymentRepository';
import { WompiGateway } from '../../infrastructure/payment/WompiGateway';
import { MongoProductRepository } from '../../infrastructure/product/MongoProductRepository';
import { MongoTransactionManager } from '../../infrastructure/shared/MongoTransactionManager';
import { MongoUserRepository } from '../../infrastructure/user/MongoUserRepository';
import { GetPaymentUseCase } from './getPayment.usecase';
import { HandleWompiEventUseCase } from './handleWompiEvent.usecase';
import { InitiatePaymentUseCase } from './initiatePayment.usecase';

export const makeInitiatePaymentUseCase = () =>
  new InitiatePaymentUseCase(
    new MongoOrderRepository(),
    new MongoPaymentRepository(),
    new WompiGateway(),
    new MongoUserRepository(),
  );

export const makeHandleWompiEventUseCase = () =>
  new HandleWompiEventUseCase(
    new MongoPaymentRepository(),
    new MongoOrderRepository(),
    new MongoProductRepository(),
    new MongoTransactionManager(),
  );

export const makeGetPaymentUseCase = () =>
  new GetPaymentUseCase(new MongoPaymentRepository());
