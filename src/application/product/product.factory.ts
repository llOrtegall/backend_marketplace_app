import { MongoProductRepository } from '../../infrastructure/product/MongoProductRepository';
import { CreateProductUseCase } from './createProduct.usecase';
import { DeleteProductUseCase } from './deleteProduct.usecase';
import { GetProductUseCase } from './getProduct.usecase';
import { ListProductsUseCase } from './listProducts.usecase';
import { UpdateProductUseCase } from './updateProduct.usecase';

export const makeCreateProductUseCase = () =>
  new CreateProductUseCase(new MongoProductRepository());

export const makeGetProductUseCase = () =>
  new GetProductUseCase(new MongoProductRepository());

export const makeListProductsUseCase = () =>
  new ListProductsUseCase(new MongoProductRepository());

export const makeUpdateProductUseCase = () =>
  new UpdateProductUseCase(new MongoProductRepository());

export const makeDeleteProductUseCase = () =>
  new DeleteProductUseCase(new MongoProductRepository());
