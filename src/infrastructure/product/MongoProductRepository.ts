import { Product } from '../../domain/product/Product';
import type {
  PaginatedResult,
  PaginationOptions,
  ProductFilters,
  ProductRepository,
} from '../../domain/product/ProductRepository';
import { Price, Stock } from '../../domain/product/ProductValueObjects';
import { ProductModel, type ProductDocument } from './ProductSchema';

export class MongoProductRepository implements ProductRepository {
  async findById(id: string): Promise<Product | null> {
    const doc = await ProductModel.findById(id).lean();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findAll(
    filters: ProductFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Product>> {
    const query: Record<string, unknown> = {};

    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = filters.category;
    if (filters.sellerId) query.sellerId = filters.sellerId;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {
        ...(filters.minPrice !== undefined && { $gte: filters.minPrice }),
        ...(filters.maxPrice !== undefined && { $lte: filters.maxPrice }),
      };
    }

    const skip = (pagination.page - 1) * pagination.limit;
    const sort = {
      [pagination.sortBy]: pagination.order === 'asc' ? 1 : -1,
    } as Record<string, 1 | -1>;

    const [docs, total] = await Promise.all([
      ProductModel.find(query)
        .sort(sort)
        .skip(skip)
        .limit(pagination.limit)
        .lean(),
      ProductModel.countDocuments(query),
    ]);

    return {
      items: docs.map((d) => this.toDomain(d)),
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  async save(product: Product): Promise<void> {
    await ProductModel.create(this.toPersistence(product));
  }

  async update(product: Product): Promise<void> {
    await ProductModel.findByIdAndUpdate(
      product.id,
      this.toPersistence(product),
    );
  }

  private toDomain(doc: ProductDocument): Product {
    return Product.reconstitute({
      id: doc._id,
      name: doc.name,
      description: doc.description,
      price: Price.fromPersistence(doc.price),
      stock: Stock.fromPersistence(doc.stock),
      category: doc.category,
      images: doc.images,
      sellerId: doc.sellerId,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      deletedAt: doc.deletedAt,
    });
  }

  private toPersistence(product: Product): ProductDocument {
    return {
      _id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      images: product.images,
      sellerId: product.sellerId,
      status: product.status,
      deletedAt: product.deletedAt,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
