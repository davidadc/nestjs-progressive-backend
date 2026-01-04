import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ReviewsService } from '../../application/services/reviews.service';
import {
  CreateReviewDto,
  UpdateReviewDto,
} from '../../application/dto/create-review.dto';
import {
  ReviewResponseDto,
  PaginatedReviewsResponseDto,
} from '../../application/dto/review-response.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Reviews')
@Controller('products/:productId/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get reviews for a product' })
  @ApiParam({ name: 'productId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of reviews with rating',
    type: PaginatedReviewsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductReviews(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedReviewsResponseDto> {
    return this.reviewsService.getProductReviews(productId, page, limit);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review for a product' })
  @ApiParam({ name: 'productId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 201,
    description: 'Review created',
    type: ReviewResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({
    status: 409,
    description: 'User already reviewed this product',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createReview(
    @CurrentUser('id') userId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.createReview(userId, productId, dto);
  }

  @Put(':reviewId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a review' })
  @ApiParam({ name: 'productId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'reviewId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Review updated',
    type: ReviewResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateReview(
    @CurrentUser('id') userId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body() dto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.updateReview(userId, reviewId, dto);
  }

  @Delete(':reviewId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review' })
  @ApiParam({ name: 'productId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'reviewId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Review deleted' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteReview(
    @CurrentUser('id') userId: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
  ): Promise<void> {
    return this.reviewsService.deleteReview(userId, reviewId);
  }
}
