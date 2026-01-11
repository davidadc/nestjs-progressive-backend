import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { CreatePostHandler } from './create-post.handler';
import { CreatePostCommand } from './create-post.command';
import { POST_REPOSITORY } from '../../domain/repositories/post.repository.interface';
import { HashtagExtractorService } from '../services/hashtag-extractor.service';
import { PostCreatedEvent } from '../../domain/events/post-created.event';

describe('CreatePostHandler', () => {
  let handler: CreatePostHandler;
  let postRepository: any;
  let eventBus: any;
  let hashtagExtractor: HashtagExtractorService;

  const mockAuthor = {
    id: 'author-123',
    username: 'testuser',
    name: 'Test User',
    avatar: null,
  };

  const mockPost = {
    id: 'post-123',
    authorId: 'author-123',
    content: 'Test post #testing',
    images: [],
    likesCount: 0,
    commentsCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: mockAuthor,
    hashtags: [],
  };

  beforeEach(async () => {
    postRepository = {
      save: jest.fn(),
      findByIdWithAuthor: jest.fn(),
      findOrCreateHashtags: jest.fn(),
      incrementHashtagUsage: jest.fn(),
      incrementPostsCount: jest.fn(),
    };

    eventBus = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePostHandler,
        HashtagExtractorService,
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

    handler = module.get<CreatePostHandler>(CreatePostHandler);
    hashtagExtractor = module.get<HashtagExtractorService>(
      HashtagExtractorService,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should create a post successfully', async () => {
      postRepository.save.mockResolvedValue(mockPost);
      postRepository.findByIdWithAuthor.mockResolvedValue(mockPost);
      postRepository.findOrCreateHashtags.mockResolvedValue([
        { id: 'hashtag-1', tag: 'testing' },
      ]);

      const command = new CreatePostCommand(
        'author-123',
        'Test post #testing',
        [],
      );

      const result = await handler.execute(command);

      expect(result).toBeDefined();
      expect(result.id).toBe('post-123');
      expect(result.content).toBe('Test post #testing');
      expect(result.author.id).toBe('author-123');
    });

    it('should extract and save hashtags', async () => {
      const mockHashtags = [
        { id: 'hashtag-1', tag: 'coding' },
        { id: 'hashtag-2', tag: 'nestjs' },
      ];

      postRepository.save.mockResolvedValue({
        ...mockPost,
        content: 'Learning #coding with #nestjs',
      });
      postRepository.findByIdWithAuthor.mockResolvedValue({
        ...mockPost,
        content: 'Learning #coding with #nestjs',
      });
      postRepository.findOrCreateHashtags.mockResolvedValue(mockHashtags);

      const command = new CreatePostCommand(
        'author-123',
        'Learning #coding with #nestjs',
        [],
      );

      await handler.execute(command);

      expect(postRepository.findOrCreateHashtags).toHaveBeenCalledWith([
        'coding',
        'nestjs',
      ]);
      expect(postRepository.incrementHashtagUsage).toHaveBeenCalledTimes(2);
    });

    it('should not process hashtags if content has none', async () => {
      postRepository.save.mockResolvedValue({
        ...mockPost,
        content: 'No hashtags here',
      });
      postRepository.findByIdWithAuthor.mockResolvedValue({
        ...mockPost,
        content: 'No hashtags here',
      });

      const command = new CreatePostCommand(
        'author-123',
        'No hashtags here',
        [],
      );

      await handler.execute(command);

      expect(postRepository.findOrCreateHashtags).not.toHaveBeenCalled();
    });

    it('should increment author post count', async () => {
      postRepository.save.mockResolvedValue(mockPost);
      postRepository.findByIdWithAuthor.mockResolvedValue(mockPost);
      postRepository.findOrCreateHashtags.mockResolvedValue([]);

      const command = new CreatePostCommand('author-123', 'Test post', []);

      await handler.execute(command);

      expect(postRepository.incrementPostsCount).toHaveBeenCalledWith(
        'author-123',
      );
    });

    it('should publish PostCreatedEvent', async () => {
      postRepository.save.mockResolvedValue(mockPost);
      postRepository.findByIdWithAuthor.mockResolvedValue(mockPost);
      postRepository.findOrCreateHashtags.mockResolvedValue([
        { id: 'hashtag-1', tag: 'testing' },
      ]);

      const command = new CreatePostCommand(
        'author-123',
        'Test post #testing',
        [],
      );

      await handler.execute(command);

      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(PostCreatedEvent));
    });

    it('should handle images', async () => {
      const images = ['image1.jpg', 'image2.jpg'];
      postRepository.save.mockResolvedValue({ ...mockPost, images });
      postRepository.findByIdWithAuthor.mockResolvedValue({
        ...mockPost,
        images,
      });

      const command = new CreatePostCommand('author-123', 'Test post', images);

      const result = await handler.execute(command);

      expect(result.images).toEqual(images);
    });

    it('should return properly formatted response', async () => {
      postRepository.save.mockResolvedValue(mockPost);
      postRepository.findByIdWithAuthor.mockResolvedValue(mockPost);
      postRepository.findOrCreateHashtags.mockResolvedValue([]);

      const command = new CreatePostCommand('author-123', 'Test post', []);

      const result = await handler.execute(command);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('images');
      expect(result).toHaveProperty('likesCount');
      expect(result).toHaveProperty('commentsCount');
      expect(result).toHaveProperty('author');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
      expect(result.author).toHaveProperty('id');
      expect(result.author).toHaveProperty('username');
      expect(result.author).toHaveProperty('name');
    });
  });
});
