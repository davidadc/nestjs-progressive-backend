import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionRepository } from '../../src/payments/infrastructure/persistence/repositories/transaction.repository';
import { TransactionEntity } from '../../src/payments/infrastructure/persistence/entities/transaction.entity';

describe('TransactionRepository (Integration)', () => {
  let transactionRepository: TransactionRepository;
  let mockTypeOrmRepo: jest.Mocked<Repository<TransactionEntity>>;

  const mockTransactionEntity: TransactionEntity = {
    id: '660e8400-e29b-41d4-a716-446655440000',
    paymentId: '550e8400-e29b-41d4-a716-446655440000',
    type: 'charge',
    amount: 99.99,
    currency: 'USD',
    status: 'succeeded',
    externalId: 'pi_123',
    failureReason: null,
    providerResponse: null,
    timestamp: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findOneOrFail: jest.fn(),
    } as unknown as jest.Mocked<Repository<TransactionEntity>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionRepository,
        {
          provide: getRepositoryToken(TransactionEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    transactionRepository = module.get<TransactionRepository>(
      TransactionRepository,
    );
  });

  describe('create', () => {
    it('should create a new transaction', async () => {
      const input = {
        paymentId: '550e8400-e29b-41d4-a716-446655440000',
        type: 'charge' as const,
        amount: 99.99,
        currency: 'USD',
        status: 'succeeded' as const,
        externalId: 'pi_123',
      };

      mockTypeOrmRepo.create.mockReturnValue(mockTransactionEntity);
      mockTypeOrmRepo.save.mockResolvedValue(mockTransactionEntity);

      const result = await transactionRepository.create(input);

      expect(result.paymentId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.type).toBe('charge');
      expect(result.amount).toBe(99.99);
      expect(result.status).toBe('succeeded');
      expect(mockTypeOrmRepo.create).toHaveBeenCalled();
      expect(mockTypeOrmRepo.save).toHaveBeenCalled();
    });

    it('should create a failed transaction with reason', async () => {
      const input = {
        paymentId: '550e8400-e29b-41d4-a716-446655440000',
        type: 'charge' as const,
        amount: 99.99,
        currency: 'USD',
        status: 'failed' as const,
        failureReason: 'Card declined',
      };

      const failedEntity = {
        ...mockTransactionEntity,
        status: 'failed' as const,
        failureReason: 'Card declined',
      };
      mockTypeOrmRepo.create.mockReturnValue(failedEntity);
      mockTypeOrmRepo.save.mockResolvedValue(failedEntity);

      const result = await transactionRepository.create(input);

      expect(result.status).toBe('failed');
      expect(result.failureReason).toBe('Card declined');
    });

    it('should create a refund transaction', async () => {
      const input = {
        paymentId: '550e8400-e29b-41d4-a716-446655440000',
        type: 'refund' as const,
        amount: 99.99,
        currency: 'USD',
        status: 'succeeded' as const,
        externalId: 're_123',
      };

      const refundEntity = {
        ...mockTransactionEntity,
        type: 'refund' as const,
        externalId: 're_123',
      };
      mockTypeOrmRepo.create.mockReturnValue(refundEntity);
      mockTypeOrmRepo.save.mockResolvedValue(refundEntity);

      const result = await transactionRepository.create(input);

      expect(result.type).toBe('refund');
      expect(result.externalId).toBe('re_123');
    });
  });

  describe('findById', () => {
    it('should return transaction when found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(mockTransactionEntity);

      const result = await transactionRepository.findById(
        '660e8400-e29b-41d4-a716-446655440000',
      );

      expect(result).not.toBeNull();
      expect(result?.id).toBe('660e8400-e29b-41d4-a716-446655440000');
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: '660e8400-e29b-41d4-a716-446655440000' },
      });
    });

    it('should return null when transaction not found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      const result = await transactionRepository.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByPaymentId', () => {
    it('should return all transactions for a payment', async () => {
      const transactions = [
        mockTransactionEntity,
        {
          ...mockTransactionEntity,
          id: '660e8400-e29b-41d4-a716-446655440001',
          type: 'refund' as const,
        },
      ];
      mockTypeOrmRepo.find.mockResolvedValue(transactions);

      const result = await transactionRepository.findByPaymentId(
        '550e8400-e29b-41d4-a716-446655440000',
      );

      expect(result).toHaveLength(2);
      expect(result[0].paymentId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(mockTypeOrmRepo.find).toHaveBeenCalledWith({
        where: { paymentId: '550e8400-e29b-41d4-a716-446655440000' },
        order: { timestamp: 'DESC' },
      });
    });

    it('should return empty array when no transactions found', async () => {
      mockTypeOrmRepo.find.mockResolvedValue([]);

      const result = await transactionRepository.findByPaymentId(
        'payment-without-transactions',
      );

      expect(result).toHaveLength(0);
    });
  });

  describe('findAll', () => {
    it('should return paginated transactions', async () => {
      mockTypeOrmRepo.findAndCount.mockResolvedValue([
        [mockTransactionEntity],
        1,
      ]);

      const result = await transactionRepository.findAll({
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.pages).toBe(1);
    });

    it('should filter by paymentId', async () => {
      mockTypeOrmRepo.findAndCount.mockResolvedValue([
        [mockTransactionEntity],
        1,
      ]);

      await transactionRepository.findAll({
        page: 1,
        limit: 10,
        paymentId: '550e8400-e29b-41d4-a716-446655440000',
      });

      expect(mockTypeOrmRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            paymentId: '550e8400-e29b-41d4-a716-446655440000',
          }),
        }),
      );
    });

    it('should filter by status', async () => {
      mockTypeOrmRepo.findAndCount.mockResolvedValue([
        [mockTransactionEntity],
        1,
      ]);

      await transactionRepository.findAll({
        page: 1,
        limit: 10,
        status: 'succeeded',
      });

      expect(mockTypeOrmRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'succeeded',
          }),
        }),
      );
    });

    it('should filter by type', async () => {
      mockTypeOrmRepo.findAndCount.mockResolvedValue([
        [mockTransactionEntity],
        1,
      ]);

      await transactionRepository.findAll({
        page: 1,
        limit: 10,
        type: 'charge',
      });

      expect(mockTypeOrmRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'charge',
          }),
        }),
      );
    });

    it('should calculate pages correctly', async () => {
      mockTypeOrmRepo.findAndCount.mockResolvedValue([[], 25]);

      const result = await transactionRepository.findAll({
        page: 1,
        limit: 10,
      });

      expect(result.pages).toBe(3);
    });
  });

  describe('updateStatus', () => {
    it('should update transaction status', async () => {
      const updatedEntity = {
        ...mockTransactionEntity,
        status: 'failed' as const,
        failureReason: 'Timeout',
      };
      mockTypeOrmRepo.update.mockResolvedValue({ affected: 1 } as any);
      mockTypeOrmRepo.findOneOrFail.mockResolvedValue(updatedEntity);

      const result = await transactionRepository.updateStatus(
        '660e8400-e29b-41d4-a716-446655440000',
        'failed',
        'Timeout',
      );

      expect(result.status).toBe('failed');
      expect(result.failureReason).toBe('Timeout');
      expect(mockTypeOrmRepo.update).toHaveBeenCalledWith(
        '660e8400-e29b-41d4-a716-446655440000',
        { status: 'failed', failureReason: 'Timeout' },
      );
    });
  });
});
