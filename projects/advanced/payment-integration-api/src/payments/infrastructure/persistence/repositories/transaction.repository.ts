import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { randomUUID } from 'crypto';
import {
  ITransactionRepository,
  TransactionRecord,
  CreateTransactionInput,
  FindTransactionsOptions,
  PaginatedTransactions,
} from '../../../domain';
import { TransactionEntity } from '../entities';
import { TransactionMapper } from '../../../application/mappers';

@Injectable()
export class TransactionRepository implements ITransactionRepository {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly repository: Repository<TransactionEntity>,
  ) {}

  async create(input: CreateTransactionInput): Promise<TransactionRecord> {
    const entity = this.repository.create({
      id: randomUUID(),
      paymentId: input.paymentId,
      type: input.type,
      amount: input.amount,
      currency: input.currency,
      status: input.status,
      externalId: input.externalId ?? null,
      failureReason: input.failureReason ?? null,
      providerResponse: input.providerResponse ?? null,
    });

    const saved = await this.repository.save(entity);
    return TransactionMapper.toRecord(saved);
  }

  async findById(id: string): Promise<TransactionRecord | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? TransactionMapper.toRecord(entity) : null;
  }

  async findByPaymentId(paymentId: string): Promise<TransactionRecord[]> {
    const entities = await this.repository.find({
      where: { paymentId },
      order: { timestamp: 'DESC' },
    });
    return entities.map((e) => TransactionMapper.toRecord(e));
  }

  async findAll(options: FindTransactionsOptions): Promise<PaginatedTransactions> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<TransactionEntity> = {};

    if (options.paymentId) {
      where.paymentId = options.paymentId;
    }
    if (options.status) {
      where.status = options.status;
    }
    if (options.type) {
      where.type = options.type;
    }

    const [entities, total] = await this.repository.findAndCount({
      where,
      order: { timestamp: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: entities.map((e) => TransactionMapper.toRecord(e)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async updateStatus(
    id: string,
    status: 'pending' | 'succeeded' | 'failed',
    failureReason?: string,
  ): Promise<TransactionRecord> {
    await this.repository.update(id, {
      status,
      failureReason: failureReason ?? null,
    });

    const updated = await this.repository.findOneOrFail({ where: { id } });
    return TransactionMapper.toRecord(updated);
  }
}
