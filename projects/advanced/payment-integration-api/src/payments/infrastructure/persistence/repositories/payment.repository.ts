import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, IPaymentRepository } from '../../../domain';
import { PaymentEntity } from '../entities';
import { PaymentMapper } from '../../../application/mappers';

@Injectable()
export class PaymentRepository implements IPaymentRepository {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly repository: Repository<PaymentEntity>,
  ) {}

  async save(payment: Payment): Promise<Payment> {
    const entity = this.repository.create(PaymentMapper.toPersistence(payment));
    const saved = await this.repository.save(entity);
    return PaymentMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Payment | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? PaymentMapper.toDomain(entity) : null;
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    const entity = await this.repository.findOne({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
    return entity ? PaymentMapper.toDomain(entity) : null;
  }

  async findByExternalId(externalId: string): Promise<Payment | null> {
    const entity = await this.repository.findOne({ where: { externalId } });
    return entity ? PaymentMapper.toDomain(entity) : null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  findByUserId(userId: string): Promise<Payment[]> {
    // This would require a join with orders table
    // For now, we return empty array - should be implemented with proper order integration
    return Promise.resolve([]);
  }

  async existsByOrderId(orderId: string): Promise<boolean> {
    const count = await this.repository.count({ where: { orderId } });
    return count > 0;
  }
}
