import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  INotificationRepository,
  PaginationOptions,
  PaginatedResult,
  CreateNotificationData,
} from '../../domain/repositories/notification.repository.interface';
import { NotificationEntity } from '../../../shared/persistence/entities/notification.entity';

@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
  ) {}

  async findById(id: string): Promise<NotificationEntity | null> {
    return this.notificationRepo.findOne({
      where: { id },
      relations: ['actor'],
    });
  }

  async findByUser(
    userId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResult<NotificationEntity>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [items, total] = await this.notificationRepo.findAndCount({
      where: { userId },
      relations: ['actor'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findUnreadByUser(userId: string): Promise<NotificationEntity[]> {
    return this.notificationRepo.find({
      where: { userId, read: false },
      relations: ['actor'],
      order: { createdAt: 'DESC' },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: { userId, read: false },
    });
  }

  async create(data: CreateNotificationData): Promise<NotificationEntity> {
    const notification = this.notificationRepo.create({
      userId: data.userId,
      type: data.type,
      actorId: data.actorId,
      targetId: data.targetId,
      read: false,
    });

    return this.notificationRepo.save(notification);
  }

  async markAsRead(id: string): Promise<void> {
    await this.notificationRepo.update(id, { read: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.update({ userId, read: false }, { read: true });
  }

  async delete(id: string): Promise<void> {
    await this.notificationRepo.delete(id);
  }
}
