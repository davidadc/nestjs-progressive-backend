export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');

export interface TransactionRecord {
  id: string;
  paymentId: string;
  type: 'charge' | 'refund' | 'dispute';
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  externalId: string | null;
  failureReason: string | null;
  providerResponse: Record<string, unknown> | null;
  timestamp: Date;
}

export interface CreateTransactionInput {
  paymentId: string;
  type: 'charge' | 'refund' | 'dispute';
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  externalId?: string;
  failureReason?: string;
  providerResponse?: Record<string, unknown>;
}

export interface FindTransactionsOptions {
  paymentId?: string;
  status?: 'pending' | 'succeeded' | 'failed';
  type?: 'charge' | 'refund' | 'dispute';
  page?: number;
  limit?: number;
}

export interface PaginatedTransactions {
  data: TransactionRecord[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ITransactionRepository {
  /**
   * Create a transaction record
   */
  create(input: CreateTransactionInput): Promise<TransactionRecord>;

  /**
   * Find a transaction by ID
   */
  findById(id: string): Promise<TransactionRecord | null>;

  /**
   * Find transactions by payment ID
   */
  findByPaymentId(paymentId: string): Promise<TransactionRecord[]>;

  /**
   * Find transactions with pagination and filters
   */
  findAll(options: FindTransactionsOptions): Promise<PaginatedTransactions>;

  /**
   * Update transaction status
   */
  updateStatus(
    id: string,
    status: 'pending' | 'succeeded' | 'failed',
    failureReason?: string,
  ): Promise<TransactionRecord>;
}
