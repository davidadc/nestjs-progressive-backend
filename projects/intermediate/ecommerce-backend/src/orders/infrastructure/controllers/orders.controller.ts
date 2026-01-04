import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { OrdersService } from '../../application/services/orders.service';
import { CreateOrderDto } from '../../application/dto/create-order.dto';
import {
  OrderResponseDto,
  PaginatedOrdersResponseDto,
} from '../../application/dto/order-response.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order from cart' })
  @ApiResponse({
    status: 201,
    description: 'Order created',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cart is empty or insufficient stock',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createOrder(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.createOrder(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user orders' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of orders',
    type: PaginatedOrdersResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOrders(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedOrdersResponseDto> {
    return this.ordersService.getOrders(userId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Order found',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOrderById(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) orderId: string,
  ): Promise<OrderResponseDto> {
    return this.ordersService.getOrderById(userId, orderId);
  }
}
