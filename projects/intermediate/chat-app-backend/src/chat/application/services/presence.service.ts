import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

type UserStatus = 'online' | 'away' | 'busy';

@Injectable()
export class PresenceService {
  private redis: Redis;
  private readonly PRESENCE_PREFIX = 'presence:';
  private readonly TYPING_PREFIX = 'typing:';
  private readonly ONLINE_USERS_SET = 'online_users';
  private readonly PRESENCE_TTL = 300; // 5 minutes
  private readonly TYPING_TTL = 5; // 5 seconds

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
    });
  }

  async setUserOnline(
    userId: string,
    status: UserStatus = 'online',
  ): Promise<void> {
    const key = `${this.PRESENCE_PREFIX}${userId}`;
    await this.redis.setex(key, this.PRESENCE_TTL, status);
    await this.redis.sadd(this.ONLINE_USERS_SET, userId);
  }

  async setUserOffline(userId: string): Promise<void> {
    const key = `${this.PRESENCE_PREFIX}${userId}`;
    await this.redis.del(key);
    await this.redis.srem(this.ONLINE_USERS_SET, userId);
    // Clean up any typing indicators
    const typingKeys = await this.redis.keys(
      `${this.TYPING_PREFIX}*:${userId}`,
    );
    if (typingKeys.length > 0) {
      await this.redis.del(...typingKeys);
    }
  }

  async updateStatus(userId: string, status: UserStatus): Promise<void> {
    const key = `${this.PRESENCE_PREFIX}${userId}`;
    await this.redis.setex(key, this.PRESENCE_TTL, status);
  }

  async getUserStatus(userId: string): Promise<UserStatus | null> {
    const key = `${this.PRESENCE_PREFIX}${userId}`;
    const status = await this.redis.get(key);
    return status as UserStatus | null;
  }

  async getOnlineUserIds(): Promise<string[]> {
    return this.redis.smembers(this.ONLINE_USERS_SET);
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const result = await this.redis.sismember(this.ONLINE_USERS_SET, userId);
    return result === 1;
  }

  async setTyping(conversationId: string, userId: string): Promise<void> {
    const key = `${this.TYPING_PREFIX}${conversationId}:${userId}`;
    await this.redis.setex(key, this.TYPING_TTL, '1');
  }

  async clearTyping(conversationId: string, userId: string): Promise<void> {
    const key = `${this.TYPING_PREFIX}${conversationId}:${userId}`;
    await this.redis.del(key);
  }

  async getTypingUsers(conversationId: string): Promise<string[]> {
    const pattern = `${this.TYPING_PREFIX}${conversationId}:*`;
    const keys = await this.redis.keys(pattern);
    return keys.map((key) => key.split(':').pop()!);
  }

  async refreshPresence(userId: string): Promise<void> {
    const status = await this.getUserStatus(userId);
    if (status) {
      await this.setUserOnline(userId, status);
    }
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
