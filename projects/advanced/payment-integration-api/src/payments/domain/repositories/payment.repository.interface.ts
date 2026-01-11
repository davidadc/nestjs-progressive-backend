import { Payment } from '../aggregates';

export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');

export interface IPaymentRepository {
  /**
   * Save a payment aggregate
   */
  save(payment: Payment): Promise<Payment>;

  /**
   * Find a payment by its ID
   */
  findById(id: string): Promise<Payment | null>;

  /**
   * Find a payment by order ID
   */
  findByOrderId(orderId: string): Promise<Payment | null>;

  /**
   * Find a payment by external provider ID
   */
  findByExternalId(externalId: string): Promise<Payment | null>;

  /**
   * Find all payments for a user's orders
   */
  findByUserId(userId: string): Promise<Payment[]>;

  /**
   * Check if a payment exists for an order
   */
  existsByOrderId(orderId: string): Promise<boolean>;
}
