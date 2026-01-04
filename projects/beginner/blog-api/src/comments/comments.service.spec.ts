import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsRepository } from './comments.repository';
import { PostsService } from '../posts/posts.service';
import { Comment } from './entities/comment.entity';
import { Post } from '../posts/entities/post.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateCommentDto } from './dto/create-comment.dto';

describe('CommentsService', () => {
  let service: CommentsService;
  let commentsRepository: jest.Mocked<CommentsRepository>;
  let postsService: jest.Mocked<PostsService>;

  const mockUser: User = {
    id: 'user-id-123',
    email: 'user@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    role: UserRole.READER,
    posts: [],
    comments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPost: Partial<Post> = {
    id: 'post-id-123',
    title: 'Test Post',
    slug: 'test-post',
    content: 'Test content',
    published: true,
    authorId: 'author-id-123',
  };

  const mockComment: Comment = {
    id: 'comment-id-123',
    content: 'Test comment',
    postId: mockPost.id as string,
    post: mockPost as Post,
    userId: mockUser.id,
    user: mockUser,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockCommentsRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByPostId: jest.fn(),
      delete: jest.fn(),
    };

    const mockPostsService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: CommentsRepository, useValue: mockCommentsRepository },
        { provide: PostsService, useValue: mockPostsService },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    commentsRepository = module.get(CommentsRepository);
    postsService = module.get(PostsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateCommentDto = {
      content: 'New comment content',
    };

    it('should create a comment successfully', async () => {
      const newComment = { ...mockComment, content: createDto.content };

      postsService.findById.mockResolvedValue(mockPost as Post);
      commentsRepository.create.mockResolvedValue({
        ...newComment,
        user: undefined as unknown as User,
      });
      commentsRepository.findById.mockResolvedValue(newComment);

      const result = await service.create(
        mockUser.id,
        mockPost.id as string,
        createDto,
      );

      expect(postsService.findById).toHaveBeenCalledWith(mockPost.id);
      expect(commentsRepository.create).toHaveBeenCalledWith({
        content: createDto.content,
        userId: mockUser.id,
        postId: mockPost.id,
      });
      expect(commentsRepository.findById).toHaveBeenCalledWith(mockComment.id);
      expect(result.content).toBe(createDto.content);
    });

    it('should throw NotFoundException if post not found', async () => {
      postsService.findById.mockResolvedValue(null);

      await expect(
        service.create(mockUser.id, 'non-existent-post', createDto),
      ).rejects.toThrow(NotFoundException);

      expect(commentsRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findByPostId', () => {
    it('should return comments for a post', async () => {
      const comments = [
        mockComment,
        {
          ...mockComment,
          id: 'comment-id-456',
          content: 'Another comment',
        },
      ];
      commentsRepository.findByPostId.mockResolvedValue(comments);

      const result = await service.findByPostId(mockPost.id as string);

      expect(commentsRepository.findByPostId).toHaveBeenCalledWith(mockPost.id);
      expect(result).toHaveLength(2);
      expect(result[0].content).toBe(mockComment.content);
    });

    it('should return empty array when no comments', async () => {
      commentsRepository.findByPostId.mockResolvedValue([]);

      const result = await service.findByPostId(mockPost.id as string);

      expect(result).toEqual([]);
    });
  });

  describe('remove', () => {
    it('should delete comment successfully', async () => {
      commentsRepository.findById.mockResolvedValue(mockComment);
      commentsRepository.delete.mockResolvedValue(undefined);

      await service.remove(mockUser.id, mockComment.id);

      expect(commentsRepository.findById).toHaveBeenCalledWith(mockComment.id);
      expect(commentsRepository.delete).toHaveBeenCalledWith(mockComment.id);
    });

    it('should throw NotFoundException if comment not found', async () => {
      commentsRepository.findById.mockResolvedValue(null);

      await expect(
        service.remove(mockUser.id, 'non-existent-comment'),
      ).rejects.toThrow(NotFoundException);

      expect(commentsRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if not comment owner', async () => {
      commentsRepository.findById.mockResolvedValue(mockComment);

      await expect(
        service.remove('different-user-id', mockComment.id),
      ).rejects.toThrow(ForbiddenException);

      expect(commentsRepository.delete).not.toHaveBeenCalled();
    });
  });
});
