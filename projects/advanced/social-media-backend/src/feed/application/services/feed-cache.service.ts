import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class FeedCacheService {
  private readonly logger = new Logger(FeedCacheService.name);
  private readonly FEED_TTL = 300; // 5 minutes in seconds
  private readonly TRENDING_TTL = 600; // 10 minutes in seconds

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  private getPersonalizedFeedKey(userId: string, cursor?: string): string {
    return `feed:personal:${userId}:${cursor || 'initial'}`;
  }

  private getTrendingFeedKey(cursor?: string): string {
    return `feed:trending:${cursor || 'initial'}`;
  }

  async getPersonalizedFeed<T>(
    userId: string,
    cursor?: string,
  ): Promise<T | null> {
    try {
      const key = this.getPersonalizedFeedKey(userId, cursor);
      const cached = await this.cacheManager.get<T>(key);
      if (cached) {
        this.logger.debug(`Cache hit for personalized feed: ${key}`);
      }
      return cached || null;
    } catch (error) {
      this.logger.warn(`Cache get error: ${error.message}`);
      return null;
    }
  }

  async setPersonalizedFeed<T>(
    userId: string,
    cursor: string | undefined,
    data: T,
  ): Promise<void> {
    try {
      const key = this.getPersonalizedFeedKey(userId, cursor);
      await this.cacheManager.set(key, data, this.FEED_TTL * 1000);
      this.logger.debug(`Cache set for personalized feed: ${key}`);
    } catch (error) {
      this.logger.warn(`Cache set error: ${error.message}`);
    }
  }

  async getTrendingFeed<T>(cursor?: string): Promise<T | null> {
    try {
      const key = this.getTrendingFeedKey(cursor);
      const cached = await this.cacheManager.get<T>(key);
      if (cached) {
        this.logger.debug(`Cache hit for trending feed: ${key}`);
      }
      return cached || null;
    } catch (error) {
      this.logger.warn(`Cache get error: ${error.message}`);
      return null;
    }
  }

  async setTrendingFeed<T>(cursor: string | undefined, data: T): Promise<void> {
    try {
      const key = this.getTrendingFeedKey(cursor);
      await this.cacheManager.set(key, data, this.TRENDING_TTL * 1000);
      this.logger.debug(`Cache set for trending feed: ${key}`);
    } catch (error) {
      this.logger.warn(`Cache set error: ${error.message}`);
    }
  }

  async invalidateUserFeed(userId: string): Promise<void> {
    try {
      // In a real implementation, you'd use Redis SCAN to find and delete
      // all keys matching the pattern. For simplicity, we just log here.
      this.logger.debug(`Invalidating feed cache for user: ${userId}`);
      // With Redis, you could use: KEYS feed:personal:${userId}:* and DEL
    } catch (error) {
      this.logger.warn(`Cache invalidation error: ${error.message}`);
    }
  }
}
