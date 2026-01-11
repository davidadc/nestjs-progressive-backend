import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { FollowUserHandler } from './follow-user.handler';
import { FollowUserCommand } from './follow-user.command';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { UserFollowedEvent } from '../../domain/events/user-followed.event';
import { ProblemDetailsException } from '../../../common/exceptions/problem-details.exception';

describe('FollowUserHandler', () => {
  let handler: FollowUserHandler;
  let userRepository: any;
  let eventBus: any;

  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(async () => {
    userRepository = {
      findById: jest.fn(),
      findFollow: jest.fn(),
      createFollow: jest.fn(),
      incrementFollowingCount: jest.fn(),
      incrementFollowersCount: jest.fn(),
    };

    eventBus = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowUserHandler,
        {
          provide: USER_REPOSITORY,
          useValue: userRepository,
        },
        {
          provide: EventBus,
          useValue: eventBus,
        },
      ],
    }).compile();

    handler = module.get<FollowUserHandler>(FollowUserHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should successfully follow a user', async () => {
      const followerId = 'follower-123';
      const followingId = 'user-123';

      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.findFollow.mockResolvedValue(null);
      userRepository.createFollow.mockResolvedValue({});

      await handler.execute(new FollowUserCommand(followerId, followingId));

      expect(userRepository.findById).toHaveBeenCalledWith(followingId);
      expect(userRepository.findFollow).toHaveBeenCalledWith(
        followerId,
        followingId,
      );
      expect(userRepository.createFollow).toHaveBeenCalledWith(
        followerId,
        followingId,
      );
      expect(userRepository.incrementFollowingCount).toHaveBeenCalledWith(
        followerId,
      );
      expect(userRepository.incrementFollowersCount).toHaveBeenCalledWith(
        followingId,
      );
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(UserFollowedEvent),
      );
    });

    it('should throw error when trying to follow yourself', async () => {
      const userId = 'user-123';

      await expect(
        handler.execute(new FollowUserCommand(userId, userId)),
      ).rejects.toThrow(ProblemDetailsException);

      expect(userRepository.findById).not.toHaveBeenCalled();
      expect(userRepository.createFollow).not.toHaveBeenCalled();
    });

    it('should throw error when user to follow does not exist', async () => {
      const followerId = 'follower-123';
      const followingId = 'nonexistent-user';

      userRepository.findById.mockResolvedValue(null);

      await expect(
        handler.execute(new FollowUserCommand(followerId, followingId)),
      ).rejects.toThrow(ProblemDetailsException);

      expect(userRepository.createFollow).not.toHaveBeenCalled();
    });

    it('should throw error when already following the user', async () => {
      const followerId = 'follower-123';
      const followingId = 'user-123';

      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.findFollow.mockResolvedValue({ id: 'follow-123' });

      await expect(
        handler.execute(new FollowUserCommand(followerId, followingId)),
      ).rejects.toThrow(ProblemDetailsException);

      expect(userRepository.createFollow).not.toHaveBeenCalled();
    });

    it('should publish UserFollowedEvent after successful follow', async () => {
      const followerId = 'follower-123';
      const followingId = 'user-123';

      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.findFollow.mockResolvedValue(null);

      await handler.execute(new FollowUserCommand(followerId, followingId));

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          followerId,
          followingId,
        }),
      );
    });
  });
});
