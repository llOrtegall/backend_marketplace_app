import { MongoProductRepository } from '../../infrastructure/product/MongoProductRepository';
import { CreateProductUseCase } from './createProduct.usecase';
import { DeleteProductUseCase } from './deleteProduct.usecase';
import { GetProductUseCase } from './getProduct.usecase';
import { ListProductsUseCase } from './listProducts.usecase';
import { UpdateProductUseCase } from './updateProduct.usecase';

const productRepo = new MongoProductRepository();

export const makeCreateProductUseCase = () =>
  new CreateProductUseCase(productRepo);

export const makeGetProductUseCase = () => new GetProductUseCase(productRepo);

export const makeListProductsUseCase = () =>
  new ListProductsUseCase(productRepo);

export const makeUpdateProductUseCase = () =>
  new UpdateProductUseCase(productRepo);

export const makeDeleteProductUseCase = () =>
  new DeleteProductUseCase(productRepo);
