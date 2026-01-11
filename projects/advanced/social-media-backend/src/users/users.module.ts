import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../shared/persistence/entities/user.entity';
import { FollowEntity } from '../shared/persistence/entities/follow.entity';
import { NotificationEntity } from '../shared/persistence/entities/notification.entity';
import { UsersController } from './infrastructure/controllers/users.controller';
import { UserRepository } from './infrastructure/persistence/user.repository';
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';

// Command Handlers
import { FollowUserHandler } from './application/commands/follow-user.handler';
import { UnfollowUserHandler } from './application/commands/unfollow-user.handler';
import { UpdateProfileHandler } from './application/commands/update-profile.handler';

// Query Handlers
import { GetUserProfileHandler } from './application/queries/get-user-profile.handler';
import { GetFollowersHandler } from './application/queries/get-followers.handler';
import { GetFollowingHandler } from './application/queries/get-following.handler';
import { SearchUsersHandler } from './application/queries/search-users.handler';

// Event Handlers
import { UserFollowedHandler } from './infrastructure/event-handlers/user-followed.handler';

const CommandHandlers = [
  FollowUserHandler,
  UnfollowUserHandler,
  UpdateProfileHandler,
];

const QueryHandlers = [
  GetUserProfileHandler,
  GetFollowersHandler,
  GetFollowingHandler,
  SearchUsersHandler,
];

const EventHandlers = [UserFollowedHandler];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([UserEntity, FollowEntity, NotificationEntity]),
  ],
  controllers: [UsersController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
