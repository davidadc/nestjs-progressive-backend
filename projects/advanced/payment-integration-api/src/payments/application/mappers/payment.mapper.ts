import { Payment, PaymentId, OrderId, Money, PaymentStatus } from '../../domain';
import { PaymentEntity } from '../../infrastructure/persistence/entities';
import { PaymentResponseDto } from '../dto';

export class PaymentMapper {
  /**
   * Domain aggregate -> Response DTO
   */
  public static toDto(payment: Payment): PaymentResponseDto {
    return {
      id: payment.id.value,
      orderId: payment.orderId.value,
      amount: payment.amount.amount,
      currency: payment.amount.currency,
      status: payment.status.value,
      provider: payment.provider,
      externalId: payment.externalId ?? undefined,
      checkoutUrl: payment.checkoutUrl ?? undefined,
      failureReason: payment.failureReason ?? undefined,
      createdAt: payment.createdAt,
      completedAt: payment.completedAt ?? undefined,
    };
  }

  /**
   * ORM Entity -> Domain aggregate
   */
  public static toDomain(entity: PaymentEntity): Payment {
    return Payment.reconstitute({
      id: PaymentId.create(entity.id),
      orderId: OrderId.create(entity.orderId),
      amount: Money.create(Number(entity.amount), entity.currency),
      status: PaymentStatus.fromString(entity.status),
      provider: entity.provider,
      externalId: entity.externalId,
      checkoutUrl: entity.checkoutUrl,
      failureReason: entity.failureReason,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      completedAt: entity.completedAt,
    });
  }

  /**
   * Domain aggregate -> ORM Entity (for persistence)
   */
  public static toPersistence(payment: Payment): Partial<PaymentEntity> {
    return {
      id: payment.id.value,
      orderId: payment.orderId.value,
      amount: payment.amount.amount,
      currency: payment.amount.currency,
      status: payment.status.value,
      provider: payment.provider,
      externalId: payment.externalId,
      checkoutUrl: payment.checkoutUrl,
      failureReason: payment.failureReason,
      completedAt: payment.completedAt,
    };
  }
}
