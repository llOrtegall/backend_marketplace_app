import { MongoProductRepository } from '../../infrastructure/product/MongoProductRepository';
import { CreateProductUseCase } from './createProduct.usecase';
import { DeleteProductUseCase } from './deleteProduct.usecase';
import { GetProductUseCase } from './getProduct.usecase';
import { ListProductsUseCase } from './listProducts.usecase';
import { UpdateProductUseCase } from './updateProduct.usecase';

const repo = new MongoProductRepository();

export const makeCreateProductUseCase = () => new CreateProductUseCase(repo);

export const makeGetProductUseCase = () => new GetProductUseCase(repo);

export const makeListProductsUseCase = () => new ListProductsUseCase(repo);

export const makeUpdateProductUseCase = () => new UpdateProductUseCase(repo);

export const makeDeleteProductUseCase = () => new DeleteProductUseCase(repo);
