import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreatePostCommand } from './create-post.command';
import type { IPostRepository } from '../../domain/repositories/post.repository.interface';
import { POST_REPOSITORY } from '../../domain/repositories/post.repository.interface';
import { PostEntity } from '../../../shared/persistence/entities/post.entity';
import { PostCreatedEvent } from '../../domain/events/post-created.event';
import { PostResponseDto } from '../dto/post-response.dto';
import { HashtagExtractorService } from '../services/hashtag-extractor.service';

@CommandHandler(CreatePostCommand)
export class CreatePostHandler implements ICommandHandler<CreatePostCommand> {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
    private readonly eventBus: EventBus,
    private readonly hashtagExtractor: HashtagExtractorService,
  ) {}

  async execute(command: CreatePostCommand): Promise<PostResponseDto> {
    const { authorId, content, images } = command;

    // Extract hashtags from content
    const hashtags = this.hashtagExtractor.extract(content);

    // Create post entity
    const post = new PostEntity();
    post.authorId = authorId;
    post.content = content;
    post.images = images || [];
    post.likesCount = 0;
    post.commentsCount = 0;

    // Save post
    const savedPost = await this.postRepository.save(post);

    // Handle hashtags
    if (hashtags.length > 0) {
      const hashtagEntities =
        await this.postRepository.findOrCreateHashtags(hashtags);
      savedPost.hashtags = hashtagEntities;
      await this.postRepository.save(savedPost);

      // Increment usage count for each hashtag
      for (const hashtag of hashtagEntities) {
        await this.postRepository.incrementHashtagUsage(hashtag.id);
      }
    }

    // Update author's post count
    await this.postRepository.incrementPostsCount(authorId);

    // Publish event
    this.eventBus.publish(new PostCreatedEvent(savedPost.id, authorId, hashtags));

    // Fetch with author for response
    const postWithAuthor = await this.postRepository.findByIdWithAuthor(
      savedPost.id,
    );

    return {
      id: postWithAuthor!.id,
      content: postWithAuthor!.content,
      images: postWithAuthor!.images,
      likesCount: postWithAuthor!.likesCount,
      commentsCount: postWithAuthor!.commentsCount,
      author: {
        id: postWithAuthor!.author.id,
        username: postWithAuthor!.author.username,
        name: postWithAuthor!.author.name,
        avatar: postWithAuthor!.author.avatar,
      },
      createdAt: postWithAuthor!.createdAt,
      updatedAt: postWithAuthor!.updatedAt,
    };
  }
}
