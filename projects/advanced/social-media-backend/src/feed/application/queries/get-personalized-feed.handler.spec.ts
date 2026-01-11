import { Test, TestingModule } from '@nestjs/testing';
import { GetPersonalizedFeedHandler } from './get-personalized-feed.handler';
import { GetPersonalizedFeedQuery } from './get-personalized-feed.query';
import { FEED_REPOSITORY } from '../../domain/repositories/feed.repository.interface';
import { POST_REPOSITORY } from '../../../posts/domain/repositories/post.repository.interface';
import { FeedCacheService } from '../services/feed-cache.service';

describe('GetPersonalizedFeedHandler', () => {
  let handler: GetPersonalizedFeedHandler;
  let feedRepository: any;
  let postRepository: any;
  let feedCacheService: any;

  const mockAuthor = {
    id: 'author-123',
    username: 'testuser',
    name: 'Test User',
    avatar: null,
  };

  const mockPosts = [
    {
      id: 'post-1',
      content: 'First post',
      images: [],
      likesCount: 10,
      commentsCount: 5,
      author: mockAuthor,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'post-2',
      content: 'Second post',
      images: [],
      likesCount: 20,
      commentsCount: 8,
      author: mockAuthor,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    feedRepository = {
      getPersonalizedFeed: jest.fn(),
    };

    postRepository = {
      findLike: jest.fn(),
    };

    feedCacheService = {
      getPersonalizedFeed: jest.fn(),
      setPersonalizedFeed: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPersonalizedFeedHandler,
        {
          provide: FEED_REPOSITORY,
          useValue: feedRepository,
        },
        {
          provide: POST_REPOSITORY,
          useValue: postRepository,
        },
        {
          provide: FeedCacheService,
          useValue: feedCacheService,
        },
      ],
    }).compile();

    handler = module.get<GetPersonalizedFeedHandler>(GetPersonalizedFeedHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return cached feed if available', async () => {
      const cachedResponse = {
        items: [{ id: 'post-1', content: 'Cached post' }],
        pagination: { hasMore: false },
      };

      feedCacheService.getPersonalizedFeed.mockResolvedValue(cachedResponse);

      const query = new GetPersonalizedFeedQuery('user-123', undefined, 10);
      const result = await handler.execute(query);

      expect(result).toEqual(cachedResponse);
      expect(feedRepository.getPersonalizedFeed).not.toHaveBeenCalled();
    });

    it('should fetch from database if cache miss', async () => {
      feedCacheService.getPersonalizedFeed.mockResolvedValue(null);
      feedRepository.getPersonalizedFeed.mockResolvedValue({
        items: mockPosts,
        hasMore: false,
        nextCursor: undefined,
      });
      postRepository.findLike.mockResolvedValue(null);

      const query = new GetPersonalizedFeedQuery('user-123', undefined, 10);
      const result = await handler.execute(query);

      expect(feedRepository.getPersonalizedFeed).toHaveBeenCalledWith(
        'user-123',
        { cursor: undefined, limit: 10 },
      );
      expect(result.items).toHaveLength(2);
    });

    it('should cache the result after fetching from database', async () => {
      feedCacheService.getPersonalizedFeed.mockResolvedValue(null);
      feedRepository.getPersonalizedFeed.mockResolvedValue({
        items: mockPosts,
        hasMore: false,
      });
      postRepository.findLike.mockResolvedValue(null);

      const query = new GetPersonalizedFeedQuery('user-123', undefined, 10);
      await handler.execute(query);

      expect(feedCacheService.setPersonalizedFeed).toHaveBeenCalled();
    });

    it('should check like status for each post', async () => {
      feedCacheService.getPersonalizedFeed.mockResolvedValue(null);
      feedRepository.getPersonalizedFeed.mockResolvedValue({
        items: mockPosts,
        hasMore: false,
      });
      postRepository.findLike.mockResolvedValue(null);

      const query = new GetPersonalizedFeedQuery('user-123', undefined, 10);
      await handler.execute(query);

      expect(postRepository.findLike).toHaveBeenCalledTimes(mockPosts.length);
    });

    it('should mark posts as liked if user has liked them', async () => {
      feedCacheService.getPersonalizedFeed.mockResolvedValue(null);
      feedRepository.getPersonalizedFeed.mockResolvedValue({
        items: [mockPosts[0]],
        hasMore: false,
      });
      postRepository.findLike.mockResolvedValue({ id: 'like-123' });

      const query = new GetPersonalizedFeedQuery('user-123', undefined, 10);
      const result = await handler.execute(query);

      expect(result.items[0].isLiked).toBe(true);
    });

    it('should mark posts as not liked if user has not liked them', async () => {
      feedCacheService.getPersonalizedFeed.mockResolvedValue(null);
      feedRepository.getPersonalizedFeed.mockResolvedValue({
        items: [mockPosts[0]],
        hasMore: false,
      });
      postRepository.findLike.mockResolvedValue(null);

      const query = new GetPersonalizedFeedQuery('user-123', undefined, 10);
      const result = await handler.execute(query);

      expect(result.items[0].isLiked).toBe(false);
    });

    it('should handle cursor-based pagination', async () => {
      const cursor = '2024-01-01T00:00:00.000Z';
      feedCacheService.getPersonalizedFeed.mockResolvedValue(null);
      feedRepository.getPersonalizedFeed.mockResolvedValue({
        items: mockPosts,
        hasMore: true,
        nextCursor: '2024-01-02T00:00:00.000Z',
      });
      postRepository.findLike.mockResolvedValue(null);

      const query = new GetPersonalizedFeedQuery('user-123', cursor, 10);
      const result = await handler.execute(query);

      expect(feedRepository.getPersonalizedFeed).toHaveBeenCalledWith(
        'user-123',
        { cursor, limit: 10 },
      );
      expect(result.pagination.hasMore).toBe(true);
      expect(result.pagination.nextCursor).toBe('2024-01-02T00:00:00.000Z');
    });

    it('should return properly formatted feed items', async () => {
      feedCacheService.getPersonalizedFeed.mockResolvedValue(null);
      feedRepository.getPersonalizedFeed.mockResolvedValue({
        items: [mockPosts[0]],
        hasMore: false,
      });
      postRepository.findLike.mockResolvedValue(null);

      const query = new GetPersonalizedFeedQuery('user-123', undefined, 10);
      const result = await handler.execute(query);

      expect(result.items[0]).toHaveProperty('id');
      expect(result.items[0]).toHaveProperty('content');
      expect(result.items[0]).toHaveProperty('images');
      expect(result.items[0]).toHaveProperty('likesCount');
      expect(result.items[0]).toHaveProperty('commentsCount');
      expect(result.items[0]).toHaveProperty('author');
      expect(result.items[0]).toHaveProperty('isLiked');
      expect(result.items[0]).toHaveProperty('createdAt');
      expect(result.items[0].author).toHaveProperty('id');
      expect(result.items[0].author).toHaveProperty('username');
      expect(result.items[0].author).toHaveProperty('name');
    });

    it('should return empty feed if no posts', async () => {
      feedCacheService.getPersonalizedFeed.mockResolvedValue(null);
      feedRepository.getPersonalizedFeed.mockResolvedValue({
        items: [],
        hasMore: false,
      });

      const query = new GetPersonalizedFeedQuery('user-123', undefined, 10);
      const result = await handler.execute(query);

      expect(result.items).toHaveLength(0);
      expect(result.pagination.hasMore).toBe(false);
    });
  });
});
