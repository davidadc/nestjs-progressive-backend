import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreatePostCommand } from './create-post.command';
import type { IPostRepository } from '../../domain/repositories/post.repository.interface';
import { POST_REPOSITORY } from '../../domain/repositories/post.repository.interface';
import { PostEntity } from '../../../shared/persistence/entities/post.entity';
import { PostResponseDto } from '../dto/post-response.dto';
import { Post } from '../../domain/aggregates/post.aggregate';
import { PostMapper } from '../mappers/post.mapper';

@CommandHandler(CreatePostCommand)
export class CreatePostHandler implements ICommandHandler<CreatePostCommand> {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreatePostCommand): Promise<PostResponseDto> {
    const { authorId, content, images } = command;

    // Create post aggregate (validates content, extracts hashtags, creates event)
    const postAggregate = Post.create({ authorId, content, images });

    // Convert aggregate to persistence entity
    const postEntity = new PostEntity();
    Object.assign(postEntity, PostMapper.toPersistence(postAggregate));

    // Save post
    const savedPost = await this.postRepository.save(postEntity);

    // Handle hashtags from aggregate
    const hashtags = postAggregate.hashtags;
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

    // Publish domain events from aggregate
    postAggregate.getUncommittedEvents().forEach((event) => {
      this.eventBus.publish(event);
    });

    // Fetch with author for response and use mapper
    const postWithAuthor = await this.postRepository.findByIdWithAuthor(
      savedPost.id,
    );

    return PostMapper.toResponseDto(postWithAuthor!);
  }
}
