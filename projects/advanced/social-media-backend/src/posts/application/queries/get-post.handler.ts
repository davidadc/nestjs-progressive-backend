import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetPostQuery } from './get-post.query';
import type { IPostRepository } from '../../domain/repositories/post.repository.interface';
import { POST_REPOSITORY } from '../../domain/repositories/post.repository.interface';
import { ProblemDetailsFactory } from '../../../common/exceptions/problem-details.factory';
import { PostResponseDto } from '../dto/post-response.dto';
import { PostMapper } from '../mappers/post.mapper';

@QueryHandler(GetPostQuery)
export class GetPostHandler implements IQueryHandler<GetPostQuery> {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(query: GetPostQuery): Promise<PostResponseDto> {
    const { postId, currentUserId } = query;

    const post = await this.postRepository.findByIdWithAuthor(postId);
    if (!post) {
      throw ProblemDetailsFactory.notFound('Post', postId);
    }

    let isLiked: boolean | undefined;
    if (currentUserId) {
      const like = await this.postRepository.findLike(currentUserId, postId);
      isLiked = !!like;
    }

    return PostMapper.toResponseDto(post, isLiked);
  }
}
