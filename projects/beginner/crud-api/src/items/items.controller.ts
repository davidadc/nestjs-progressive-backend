import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { FindItemsDto } from './dto/find-items.dto';
import { ItemResponseDto } from './dto/item-response.dto';
import type { Item } from './entities/item.entity';

@ApiTags('items')
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new item' })
  @ApiBody({ type: CreateItemDto })
  @ApiResponse({
    status: 201,
    description: 'Item created successfully',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  async create(@Body() createItemDto: CreateItemDto): Promise<ItemResponseDto> {
    const item = await this.itemsService.create(createItemDto);
    return this.toResponseDto(item);
  }

  @Get()
  @ApiOperation({ summary: 'Get all items with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'List of items with pagination',
  })
  async findAll(@Query() query: FindItemsDto) {
    const result = await this.itemsService.findAll(query);
    return {
      data: result.data.map((item) => this.toResponseDto(item)),
      pagination: result.pagination,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single item by ID' })
  @ApiParam({ name: 'id', description: 'Item UUID' })
  @ApiResponse({
    status: 200,
    description: 'Item found',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ItemResponseDto> {
    const item = await this.itemsService.findOne(id);
    return this.toResponseDto(item);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Full update of an item' })
  @ApiParam({ name: 'id', description: 'Item UUID' })
  @ApiBody({ type: UpdateItemDto })
  @ApiResponse({
    status: 200,
    description: 'Item updated successfully',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateItemDto: UpdateItemDto,
  ): Promise<ItemResponseDto> {
    const item = await this.itemsService.update(id, updateItemDto);
    return this.toResponseDto(item);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partial update of an item' })
  @ApiParam({ name: 'id', description: 'Item UUID' })
  @ApiBody({ type: UpdateItemDto })
  @ApiResponse({
    status: 200,
    description: 'Item updated successfully',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async partialUpdate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateItemDto: UpdateItemDto,
  ): Promise<ItemResponseDto> {
    const item = await this.itemsService.update(id, updateItemDto);
    return this.toResponseDto(item);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an item' })
  @ApiParam({ name: 'id', description: 'Item UUID' })
  @ApiResponse({ status: 204, description: 'Item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.itemsService.remove(id);
  }

  private toResponseDto(item: Item): ItemResponseDto {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price ? Number(item.price) : null,
      quantity: item.quantity,
      category: item.category,
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
