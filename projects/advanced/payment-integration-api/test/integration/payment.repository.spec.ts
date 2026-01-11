import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentRepository } from '../../src/payments/infrastructure/persistence/repositories/payment.repository';
import { PaymentEntity } from '../../src/payments/infrastructure/persistence/entities/payment.entity';
import { Payment, PaymentId, OrderId, Money, PaymentStatus } from '../../src/payments/domain';

describe('PaymentRepository (Integration)', () => {
  let paymentRepository: PaymentRepository;
  let mockTypeOrmRepo: jest.Mocked<Repository<PaymentEntity>>;

  const mockPaymentEntity: PaymentEntity = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    orderId: 'order-123',
    amount: 99.99,
    currency: 'USD',
    status: 'pending',
    provider: 'stripe',
    externalId: null,
    checkoutUrl: null,
    failureReason: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    completedAt: null,
  };

  beforeEach(async () => {
    mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn().mockImplementation((entity) => entity),
      count: jest.fn(),
    } as unknown as jest.Mocked<Repository<PaymentEntity>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentRepository,
        {
          provide: getRepositoryToken(PaymentEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    paymentRepository = module.get<PaymentRepository>(PaymentRepository);
  });

  describe('findById', () => {
    it('should return payment when found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(mockPaymentEntity);

      const result = await paymentRepository.findById('550e8400-e29b-41d4-a716-446655440000');

      expect(result).toBeInstanceOf(Payment);
      expect(result?.id.value).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result?.orderId.value).toBe('order-123');
      expect(result?.amount.amount).toBe(99.99);
      expect(result?.status.value).toBe('pending');
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-446655440000' },
      });
    });

    it('should return null when payment not found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      const result = await paymentRepository.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByOrderId', () => {
    it('should return payment when found by order ID', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(mockPaymentEntity);

      const result = await paymentRepository.findByOrderId('order-123');

      expect(result).toBeInstanceOf(Payment);
      expect(result?.orderId.value).toBe('order-123');
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { orderId: 'order-123' },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return null when no payment for order', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      const result = await paymentRepository.findByOrderId('nonexistent-order');

      expect(result).toBeNull();
    });
  });

  describe('findByExternalId', () => {
    it('should return payment when found by external ID', async () => {
      const entityWithExternalId = { ...mockPaymentEntity, externalId: 'cs_123' };
      mockTypeOrmRepo.findOne.mockResolvedValue(entityWithExternalId);

      const result = await paymentRepository.findByExternalId('cs_123');

      expect(result).toBeInstanceOf(Payment);
      expect(result?.externalId).toBe('cs_123');
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { externalId: 'cs_123' },
      });
    });
  });

  describe('save', () => {
    it('should persist payment aggregate', async () => {
      const payment = Payment.create({
        orderId: OrderId.create('order-456'),
        amount: Money.create(50, 'USD'),
      });

      const savedEntity = {
        ...mockPaymentEntity,
        id: payment.id.value,
        orderId: 'order-456',
        amount: 50,
      };

      mockTypeOrmRepo.save.mockResolvedValue(savedEntity);

      const result = await paymentRepository.save(payment);

      expect(mockTypeOrmRepo.create).toHaveBeenCalled();
      expect(mockTypeOrmRepo.save).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Payment);
    });

    it('should update existing payment', async () => {
      const payment = Payment.reconstitute({
        id: PaymentId.create('550e8400-e29b-41d4-a716-446655440000'),
        orderId: OrderId.create('order-123'),
        amount: Money.create(99.99, 'USD'),
        status: PaymentStatus.Processing,
        provider: 'stripe',
        externalId: 'cs_123',
        checkoutUrl: 'https://checkout.stripe.com/pay/cs_123',
        failureReason: null,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        completedAt: null,
      });

      const savedEntity = {
        ...mockPaymentEntity,
        status: 'processing',
        externalId: 'cs_123',
      };

      mockTypeOrmRepo.save.mockResolvedValue(savedEntity);

      const result = await paymentRepository.save(payment);

      expect(mockTypeOrmRepo.create).toHaveBeenCalled();
      expect(mockTypeOrmRepo.save).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Payment);
    });
  });

  describe('existsByOrderId', () => {
    it('should return true when payment exists for order', async () => {
      mockTypeOrmRepo.count.mockResolvedValue(1);

      const result = await paymentRepository.existsByOrderId('order-123');

      expect(result).toBe(true);
      expect(mockTypeOrmRepo.count).toHaveBeenCalledWith({
        where: { orderId: 'order-123' },
      });
    });

    it('should return false when no payment exists for order', async () => {
      mockTypeOrmRepo.count.mockResolvedValue(0);

      const result = await paymentRepository.existsByOrderId('nonexistent-order');

      expect(result).toBe(false);
    });
  });

  describe('findByUserId', () => {
    it('should return empty array (not implemented with order integration)', async () => {
      const result = await paymentRepository.findByUserId('user-123');

      expect(result).toEqual([]);
    });
  });
});
