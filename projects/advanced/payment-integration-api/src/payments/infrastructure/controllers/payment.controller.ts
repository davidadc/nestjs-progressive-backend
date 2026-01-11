import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiHeader,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Idempotent } from '../../../common/idempotency';
import {
  InitiatePaymentCommand,
  RefundPaymentCommand,
  GetPaymentStatusQuery,
  GetPaymentByIdQuery,
  ListTransactionsQuery,
  InitiatePaymentDto,
  PaymentResponseDto,
  ListTransactionsDto,
  PaginatedTransactionsResponseDto,
} from '../../application';

@ApiTags('Payments')
@Controller('api/v1')
export class PaymentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('orders/:orderId/checkout')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ short: { limit: 3, ttl: 1000 }, long: { limit: 10, ttl: 60000 } }) // Stricter: 3/sec, 10/min
  @Idempotent(24 * 60 * 60 * 1000) // 24 hours TTL
  @ApiOperation({ summary: 'Initiate payment for an order' })
  @ApiParam({ name: 'orderId', description: 'Order ID', type: String })
  @ApiHeader({
    name: 'Idempotency-Key',
    description:
      'Unique key for idempotent requests (prevents duplicate payments)',
    required: false,
  })
  @ApiResponse({
    status: 201,
    description: 'Payment initiated successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({
    status: 409,
    description:
      'Payment already exists for order or duplicate idempotency key',
  })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  async initiatePayment(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: InitiatePaymentDto,
  ): Promise<{
    success: boolean;
    statusCode: number;
    data: PaymentResponseDto;
  }> {
    // TODO: Get order from OrderService and extract amount
    // For now, using a placeholder amount
    const orderAmount = 99.99; // This should come from OrderService

    const command = new InitiatePaymentCommand(
      orderId,
      orderAmount,
      dto.currency ?? 'USD',
      dto.returnUrl,
      dto.cancelUrl,
    );

    const payment = await this.commandBus.execute<
      InitiatePaymentCommand,
      PaymentResponseDto
    >(command);

    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      data: payment,
    };
  }

  @Get('orders/:orderId/payment-status')
  @ApiOperation({ summary: 'Get payment status for an order' })
  @ApiParam({ name: 'orderId', description: 'Order ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Payment status retrieved',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPaymentStatus(
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ): Promise<{
    success: boolean;
    statusCode: number;
    data: PaymentResponseDto;
  }> {
    const query = new GetPaymentStatusQuery(orderId);
    const payment = await this.queryBus.execute<
      GetPaymentStatusQuery,
      PaymentResponseDto
    >(query);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: payment,
    };
  }

  @Get('payments/:paymentId')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiParam({ name: 'paymentId', description: 'Payment ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Payment retrieved',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPaymentById(
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
  ): Promise<{
    success: boolean;
    statusCode: number;
    data: PaymentResponseDto;
  }> {
    const query = new GetPaymentByIdQuery(paymentId);
    const payment = await this.queryBus.execute<
      GetPaymentByIdQuery,
      PaymentResponseDto
    >(query);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: payment,
    };
  }

  @Post('payments/:paymentId/refund')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 3, ttl: 1000 }, long: { limit: 10, ttl: 60000 } }) // Stricter: 3/sec, 10/min
  @Idempotent(24 * 60 * 60 * 1000) // 24 hours TTL
  @ApiOperation({ summary: 'Initiate refund for a payment' })
  @ApiParam({ name: 'paymentId', description: 'Payment ID', type: String })
  @ApiHeader({
    name: 'Idempotency-Key',
    description:
      'Unique key for idempotent requests (prevents duplicate refunds)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Refund initiated successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot refund payment in current state',
  })
  @ApiResponse({ status: 409, description: 'Duplicate idempotency key' })
  @ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
  async refundPayment(
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
  ): Promise<{
    success: boolean;
    statusCode: number;
    data: PaymentResponseDto;
  }> {
    const command = new RefundPaymentCommand(paymentId);
    const payment = await this.commandBus.execute<
      RefundPaymentCommand,
      PaymentResponseDto
    >(command);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: payment,
    };
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List all transactions' })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved',
    type: PaginatedTransactionsResponseDto,
  })
  async listTransactions(@Query() dto: ListTransactionsDto): Promise<{
    success: boolean;
    statusCode: number;
    data: PaginatedTransactionsResponseDto;
  }> {
    const query = new ListTransactionsQuery({
      paymentId: dto.paymentId,
      status: dto.status,
      type: dto.type,
      page: dto.page,
      limit: dto.limit,
    });

    const result = await this.queryBus.execute<
      ListTransactionsQuery,
      PaginatedTransactionsResponseDto
    >(query);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: result,
    };
  }
}
