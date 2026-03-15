import { MongoProductRepository } from '../../infrastructure/product/MongoProductRepository';
import { CreateProductUseCase } from './createProduct.usecase';
import { DeleteProductUseCase } from './deleteProduct.usecase';
import { GetProductUseCase } from './getProduct.usecase';
import { ListProductsUseCase } from './listProducts.usecase';
import { UpdateProductUseCase } from './updateProduct.usecase';

function makeRepo() {
  return new MongoProductRepository();
}

export const makeCreateProductUseCase = () =>
  new CreateProductUseCase(makeRepo());

export const makeGetProductUseCase = () => new GetProductUseCase(makeRepo());

export const makeListProductsUseCase = () =>
  new ListProductsUseCase(makeRepo());

export const makeUpdateProductUseCase = () =>
  new UpdateProductUseCase(makeRepo());

export const makeDeleteProductUseCase = () =>
  new DeleteProductUseCase(makeRepo());
