import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { FindItemsDto } from './dto/find-items.dto';
import { Item } from './entities/item.entity';
import { PaginatedResponse } from '../common/dto/paginated-response.dto';
import type { IItemsRepository } from './items.repository.interface';
import { ITEMS_REPOSITORY } from './items.repository.interface';

@Injectable()
export class ItemsService {
  constructor(
    @Inject(ITEMS_REPOSITORY)
    private readonly itemsRepository: IItemsRepository,
  ) {}

  async create(createItemDto: CreateItemDto): Promise<Item> {
    return this.itemsRepository.create(createItemDto);
  }

  async findAll(query: FindItemsDto): Promise<PaginatedResponse<Item>> {
    return this.itemsRepository.findAll(query);
  }

  async findOne(id: string): Promise<Item> {
    const item = await this.itemsRepository.findById(id);

    if (!item) {
      throw new NotFoundException(`Item with ID '${id}' not found`);
    }

    return item;
  }

  async update(id: string, updateItemDto: UpdateItemDto): Promise<Item> {
    // Check if item exists
    await this.findOne(id);

    return this.itemsRepository.update(id, updateItemDto);
  }

  async remove(id: string): Promise<void> {
    // Check if item exists
    await this.findOne(id);

    await this.itemsRepository.delete(id);
  }
}
