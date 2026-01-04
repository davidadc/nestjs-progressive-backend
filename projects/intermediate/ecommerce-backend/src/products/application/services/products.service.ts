import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { PRODUCT_REPOSITORY } from '../../domain/repositories/product.repository.interface';
import type { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository.interface';
import { Product } from '../../domain/entities/product.entity';
import { CreateProductDto, UpdateProductDto } from '../dto/create-product.dto';
import { FilterProductsDto } from '../dto/filter-products.dto';
import {
  ProductResponseDto,
  PaginatedProductsResponseDto,
} from '../dto/product-response.dto';
import { ProductMapper } from '../mappers/product.mapper';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
    private readonly productMapper: ProductMapper,
  ) {}

  async findAll(filter: FilterProductsDto): Promise<PaginatedProductsResponseDto> {
    const { products, total } = await this.productRepository.findAll({
      page: filter.page,
      limit: filter.limit,
      search: filter.search,
      categoryId: filter.categoryId,
      minPrice: filter.minPrice,
      maxPrice: filter.maxPrice,
      isActive: filter.isActive,
      sort: filter.sort,
      order: filter.order,
    });

    return {
      products: products.map((p) => this.productMapper.toResponseDto(p)),
      total,
      page: filter.page ?? 1,
      limit: filter.limit ?? 10,
      pages: Math.ceil(total / (filter.limit ?? 10)),
    };
  }

  async findById(id: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return this.productMapper.toResponseDto(product);
  }

  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    const category = await this.categoryRepository.findById(dto.categoryId);
    if (!category) {
      throw new BadRequestException(`Category with ID ${dto.categoryId} not found`);
    }

    const product = Product.create({
      id: uuidv4(),
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stock: dto.stock,
      categoryId: dto.categoryId,
      images: dto.images,
      isActive: dto.isActive,
    });

    const savedProduct = await this.productRepository.save(product);
    return this.productMapper.toResponseDto(savedProduct);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductResponseDto> {
    const existingProduct = await this.productRepository.findById(id);
    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (dto.categoryId) {
      const category = await this.categoryRepository.findById(dto.categoryId);
      if (!category) {
        throw new BadRequestException(`Category with ID ${dto.categoryId} not found`);
      }
    }

    const updatedProduct = new Product(
      existingProduct.id,
      dto.name ?? existingProduct.name,
      dto.description ?? existingProduct.description,
      dto.price ?? existingProduct.price,
      dto.stock ?? existingProduct.stock,
      dto.categoryId ?? existingProduct.categoryId,
      existingProduct.category,
      dto.images ?? existingProduct.images,
      dto.isActive ?? existingProduct.isActive,
      existingProduct.createdAt,
      new Date(),
      existingProduct.deletedAt,
    );

    const savedProduct = await this.productRepository.update(updatedProduct);
    return this.productMapper.toResponseDto(savedProduct);
  }

  async delete(id: string): Promise<void> {
    const existingProduct = await this.productRepository.findById(id);
    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    await this.productRepository.softDelete(id);
  }
}
