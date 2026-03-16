import type { ClientSession } from 'mongoose';
import type { DbSession } from '../../domain/shared/DbSession';
import { AppError } from '../../shared/errors/AppError';
import { Product } from '../../domain/product/Product';
import type {
  PaginatedResult,
  PaginationOptions,
  ProductFilters,
  IProductRepository,
} from '../../domain/product/ProductRepository';
import { Price, Stock } from '../../domain/product/ProductValueObjects';
import { ProductModel, type ProductDocument } from './ProductSchema';

function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(
    JSON.stringify({ c: createdAt.toISOString(), i: id }),
  ).toString('base64');
}

function decodeCursor(cursor: string): { createdAt: Date; id: string } {
  try {
    const { c, i } = JSON.parse(Buffer.from(cursor, 'base64').toString());
    return { createdAt: new Date(c), id: i };
  } catch {
    throw new AppError('INVALID_CURSOR', 'Invalid pagination cursor', 400);
  }
}

export class MongoProductRepository implements IProductRepository {
  async findById(id: string, session?: DbSession): Promise<Product | null> {
    const doc = await ProductModel.findById(id)
      .session((session as ClientSession) ?? null)
      .lean();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findAll(
    filters: ProductFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Product>> {
    const filterQuery: Record<string, unknown> = {};

    if (filters.status) filterQuery.status = filters.status;
    if (filters.category) filterQuery.category = filters.category;
    if (filters.sellerId) filterQuery.sellerId = filters.sellerId;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      filterQuery.price = {
        ...(filters.minPrice !== undefined && { $gte: filters.minPrice }),
        ...(filters.maxPrice !== undefined && { $lte: filters.maxPrice }),
      };
    }

    const rawCursor = pagination.cursor;
    const useCursor = !!rawCursor && pagination.sortBy === 'createdAt';
    const findQuery: Record<string, unknown> = { ...filterQuery };
    let skip = 0;

    if (useCursor && rawCursor) {
      const { createdAt, id } = decodeCursor(rawCursor);
      const op = pagination.order === 'desc' ? '$lt' : '$gt';
      findQuery.$and = [
        {
          $or: [
            { createdAt: { [op]: createdAt } },
            { createdAt, _id: { [op]: id } },
          ],
        },
      ];
    } else {
      skip = (pagination.page - 1) * pagination.limit;
    }

    const sort = {
      [pagination.sortBy]: pagination.order === 'asc' ? 1 : -1,
      _id: pagination.order === 'asc' ? 1 : -1,
    } as Record<string, 1 | -1>;

    const [docs, total] = await Promise.all([
      ProductModel.find(findQuery)
        .sort(sort)
        .skip(skip)
        .limit(pagination.limit)
        .lean(),
      ProductModel.countDocuments(filterQuery),
    ]);

    const items = docs.map((d) => this.toDomain(d));

    let nextCursor: string | undefined;
    if (useCursor && docs.length === pagination.limit) {
      const last = docs.at(-1);
      if (last) nextCursor = encodeCursor(last.createdAt, last._id);
    }

    return {
      items,
      total,
      page: useCursor ? 1 : pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
      nextCursor,
    };
  }

  async save(product: Product): Promise<void> {
    await ProductModel.create(this.toPersistence(product));
  }

  async decrementStockIfAvailable(
    productId: string,
    quantity: number,
    session?: DbSession,
  ): Promise<Product | null> {
    const doc = await ProductModel.findOneAndUpdate(
      { _id: productId, stock: { $gte: quantity }, status: 'active' },
      { $inc: { stock: -quantity }, $set: { updatedAt: new Date() } },
      { new: true, session: (session as ClientSession) ?? null },
    ).lean();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async restoreStock(
    productId: string,
    quantity: number,
    session?: DbSession,
  ): Promise<void> {
    await ProductModel.findOneAndUpdate(
      { _id: productId },
      { $inc: { stock: quantity }, $set: { updatedAt: new Date() } },
      { session: (session as ClientSession) ?? null },
    );
  }

  async update(product: Product, session?: DbSession): Promise<void> {
    await ProductModel.findByIdAndUpdate(
      product.id,
      this.toPersistence(product),
      { session: (session as ClientSession) ?? null },
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
