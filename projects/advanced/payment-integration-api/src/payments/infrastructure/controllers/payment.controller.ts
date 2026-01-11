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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Initiate payment for an order' })
  @ApiParam({ name: 'orderId', description: 'Order ID', type: String })
  @ApiResponse({
    status: 201,
    description: 'Payment initiated successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 409, description: 'Payment already exists for order' })
  async initiatePayment(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: InitiatePaymentDto,
  ): Promise<{ success: boolean; statusCode: number; data: PaymentResponseDto }> {
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

    const payment = await this.commandBus.execute(command);

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
  ): Promise<{ success: boolean; statusCode: number; data: PaymentResponseDto }> {
    const query = new GetPaymentStatusQuery(orderId);
    const payment = await this.queryBus.execute(query);

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
  ): Promise<{ success: boolean; statusCode: number; data: PaymentResponseDto }> {
    const query = new GetPaymentByIdQuery(paymentId);
    const payment = await this.queryBus.execute(query);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: payment,
    };
  }

  @Post('payments/:paymentId/refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate refund for a payment' })
  @ApiParam({ name: 'paymentId', description: 'Payment ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Refund initiated successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 400, description: 'Cannot refund payment in current state' })
  async refundPayment(
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
  ): Promise<{ success: boolean; statusCode: number; data: PaymentResponseDto }> {
    const command = new RefundPaymentCommand(paymentId);
    const payment = await this.commandBus.execute(command);

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
  async listTransactions(
    @Query() dto: ListTransactionsDto,
  ): Promise<{
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

    const result = await this.queryBus.execute(query);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: result,
    };
  }
}
