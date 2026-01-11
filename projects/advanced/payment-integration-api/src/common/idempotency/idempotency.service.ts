import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  IDEMPOTENCY_REPOSITORY,
  type IIdempotencyRepository,
} from './idempotency.repository';

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(
    @Inject(IDEMPOTENCY_REPOSITORY)
    private readonly idempotencyRepository: IIdempotencyRepository,
  ) {}

  /**
   * Clean up expired idempotency keys (runs every hour)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredKeys(): Promise<void> {
    try {
      const deletedCount = await this.idempotencyRepository.deleteExpired();
      if (deletedCount > 0) {
        this.logger.log(`Cleaned up ${deletedCount} expired idempotency keys`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to clean up expired idempotency keys: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
