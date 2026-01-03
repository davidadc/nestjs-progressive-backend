import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IItemsRepository } from './items.repository.interface';
import { Item } from './entities/item.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { FindItemsDto } from './dto/find-items.dto';
import { PaginatedResponse } from '../common/dto/paginated-response.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ItemsRepository implements IItemsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateItemDto): Promise<Item> {
    return this.prisma.item.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        quantity: data.quantity ?? 0,
        category: data.category,
      },
    });
  }

  async findAll(query: FindItemsDto): Promise<PaginatedResponse<Item>> {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      sort,
      order,
      isActive,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ItemWhereInput = {};

    // Search filter (name or description)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    // Active status filter
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Build orderBy
    const orderBy: Prisma.ItemOrderByWithRelationInput = {};
    if (sort) {
      orderBy[sort] = order || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    // Get items and count in parallel
    const [items, total] = await Promise.all([
      this.prisma.item.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.item.count({ where }),
    ]);

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<Item | null> {
    return this.prisma.item.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: UpdateItemDto): Promise<Item> {
    return this.prisma.item.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        quantity: data.quantity,
        category: data.category,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.item.delete({
      where: { id },
    });
  }

  async count(query: FindItemsDto): Promise<number> {
    const { search, category, isActive } = query;
    const where: Prisma.ItemWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.item.count({ where });
  }
}
