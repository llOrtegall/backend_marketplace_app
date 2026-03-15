import { AppError } from '../../shared/errors/AppError';
import {
  Price,
  Stock,
  VALID_STATUS_TRANSITIONS,
  type ProductStatus,
} from './ProductValueObjects';

export interface ProductProps {
  id: string;
  name: string;
  description: string;
  price: Price;
  stock: Stock;
  category: string;
  images: string[];
  sellerId: string;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface CreateProductInput {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  sellerId: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
  images?: string[];
  status?: 'active' | 'inactive';
}

export class Product {
  private constructor(private props: ProductProps) {}

  static create(input: CreateProductInput): Product {
    const now = new Date();
    return new Product({
      id: input.id,
      name: input.name,
      description: input.description,
      price: Price.create(input.price),
      stock: Stock.create(input.stock),
      category: input.category,
      images: input.images,
      sellerId: input.sellerId,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: ProductProps): Product {
    return new Product(props);
  }

  update(changes: UpdateProductInput): Product {
    return new Product({
      ...this.props,
      name: changes.name ?? this.props.name,
      description: changes.description ?? this.props.description,
      price:
        changes.price !== undefined
          ? Price.create(changes.price)
          : this.props.price,
      stock:
        changes.stock !== undefined
          ? Stock.create(changes.stock)
          : this.props.stock,
      category: changes.category ?? this.props.category,
      images: changes.images ?? this.props.images,
      status: changes.status ?? this.props.status,
      updatedAt: new Date(),
    });
  }

  softDelete(): Product {
    this.assertTransition('deleted');
    return new Product({
      ...this.props,
      status: 'deleted',
      deletedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  isOwnedBy(sellerId: string): boolean {
    return this.props.sellerId === sellerId;
  }

  private assertTransition(target: ProductStatus): void {
    const allowed = VALID_STATUS_TRANSITIONS[this.props.status];
    if (!allowed.includes(target)) {
      throw new AppError(
        'PRODUCT_INVALID_TRANSITION',
        `Cannot transition from '${this.props.status}' to '${target}'`,
        422,
      );
    }
  }

  get id() {
    return this.props.id;
  }
  get name() {
    return this.props.name;
  }
  get description() {
    return this.props.description;
  }
  get price() {
    return this.props.price.value;
  }
  get stock() {
    return this.props.stock.value;
  }
  get category() {
    return this.props.category;
  }
  get images() {
    return this.props.images;
  }
  get sellerId() {
    return this.props.sellerId;
  }
  get status() {
    return this.props.status;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
  get deletedAt() {
    return this.props.deletedAt;
  }
}
