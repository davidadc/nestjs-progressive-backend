import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { LikePostHandler } from './like-post.handler';
import { LikePostCommand } from './like-post.command';
import { POST_REPOSITORY } from '../../domain/repositories/post.repository.interface';
import { PostLikedEvent } from '../../domain/events/post-liked.event';
import { ProblemDetailsException } from '../../../common/exceptions/problem-details.exception';

describe('LikePostHandler', () => {
  let handler: LikePostHandler;
  let postRepository: any;
  let eventBus: any;

  const mockPost = {
    id: 'post-123',
    authorId: 'author-123',
    content: 'Test post',
    likesCount: 5,
  };

  beforeEach(async () => {
    postRepository = {
      findById: jest.fn(),
      findLike: jest.fn(),
      createLike: jest.fn(),
      incrementLikesCount: jest.fn(),
    };

    eventBus = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikePostHandler,
        {
          provide: POST_REPOSITORY,
          useValue: postRepository,
        },
        {
          provide: EventBus,
          useValue: eventBus,
        },
      ],
    }).compile();

    handler = module.get<LikePostHandler>(LikePostHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should successfully like a post', async () => {
      const userId = 'user-123';
      const postId = 'post-123';

      postRepository.findById.mockResolvedValue(mockPost);
      postRepository.findLike.mockResolvedValue(null);
      postRepository.createLike.mockResolvedValue({});

      await handler.execute(new LikePostCommand(userId, postId));

      expect(postRepository.findById).toHaveBeenCalledWith(postId);
      expect(postRepository.findLike).toHaveBeenCalledWith(userId, postId);
      expect(postRepository.createLike).toHaveBeenCalledWith(userId, postId);
      expect(postRepository.incrementLikesCount).toHaveBeenCalledWith(postId);
    });

    it('should throw error when post does not exist', async () => {
      const userId = 'user-123';
      const postId = 'nonexistent-post';

      postRepository.findById.mockResolvedValue(null);

      await expect(
        handler.execute(new LikePostCommand(userId, postId)),
      ).rejects.toThrow(ProblemDetailsException);

      expect(postRepository.createLike).not.toHaveBeenCalled();
    });

    it('should throw error when post is already liked', async () => {
      const userId = 'user-123';
      const postId = 'post-123';

      postRepository.findById.mockResolvedValue(mockPost);
      postRepository.findLike.mockResolvedValue({ id: 'like-123' });

      await expect(
        handler.execute(new LikePostCommand(userId, postId)),
      ).rejects.toThrow(ProblemDetailsException);

      expect(postRepository.createLike).not.toHaveBeenCalled();
    });

    it('should publish PostLikedEvent after successful like', async () => {
      const userId = 'user-123';
      const postId = 'post-123';

      postRepository.findById.mockResolvedValue(mockPost);
      postRepository.findLike.mockResolvedValue(null);

      await handler.execute(new LikePostCommand(userId, postId));

      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(PostLikedEvent));
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          postId,
          userId,
          postAuthorId: mockPost.authorId,
        }),
      );
    });

    it('should increment likes count', async () => {
      const userId = 'user-123';
      const postId = 'post-123';

      postRepository.findById.mockResolvedValue(mockPost);
      postRepository.findLike.mockResolvedValue(null);

      await handler.execute(new LikePostCommand(userId, postId));

      expect(postRepository.incrementLikesCount).toHaveBeenCalledWith(postId);
    });

    it('should allow author to like their own post', async () => {
      const authorId = 'author-123';
      const postId = 'post-123';

      postRepository.findById.mockResolvedValue(mockPost);
      postRepository.findLike.mockResolvedValue(null);

      await handler.execute(new LikePostCommand(authorId, postId));

      expect(postRepository.createLike).toHaveBeenCalledWith(authorId, postId);
    });
  });
});
