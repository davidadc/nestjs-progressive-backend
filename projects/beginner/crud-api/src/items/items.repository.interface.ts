import { Item } from './entities/item.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { FindItemsDto } from './dto/find-items.dto';
import { PaginatedResponse } from '../common/dto/paginated-response.dto';

export interface IItemsRepository {
  create(data: CreateItemDto): Promise<Item>;
  findAll(query: FindItemsDto): Promise<PaginatedResponse<Item>>;
  findById(id: string): Promise<Item | null>;
  update(id: string, data: UpdateItemDto): Promise<Item>;
  delete(id: string): Promise<void>;
  count(query: FindItemsDto): Promise<number>;
}

export const ITEMS_REPOSITORY = Symbol('ITEMS_REPOSITORY');
