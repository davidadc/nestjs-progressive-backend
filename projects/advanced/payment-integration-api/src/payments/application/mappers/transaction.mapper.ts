import { TransactionEntity } from '../../infrastructure/persistence/entities';
import { TransactionRecord } from '../../domain/repositories';
import { TransactionResponseDto } from '../dto';

export class TransactionMapper {
  /**
   * ORM Entity -> Record interface
   */
  public static toRecord(entity: TransactionEntity): TransactionRecord {
    return {
      id: entity.id,
      paymentId: entity.paymentId,
      type: entity.type,
      amount: Number(entity.amount),
      currency: entity.currency,
      status: entity.status,
      externalId: entity.externalId,
      failureReason: entity.failureReason,
      providerResponse: entity.providerResponse,
      timestamp: entity.timestamp,
    };
  }

  /**
   * Record -> Response DTO
   */
  public static toDto(record: TransactionRecord): TransactionResponseDto {
    return {
      id: record.id,
      paymentId: record.paymentId,
      type: record.type,
      amount: record.amount,
      currency: record.currency,
      status: record.status,
      externalId: record.externalId ?? undefined,
      failureReason: record.failureReason ?? undefined,
      timestamp: record.timestamp,
    };
  }

  /**
   * ORM Entity -> Response DTO
   */
  public static entityToDto(entity: TransactionEntity): TransactionResponseDto {
    return TransactionMapper.toDto(TransactionMapper.toRecord(entity));
  }
}
