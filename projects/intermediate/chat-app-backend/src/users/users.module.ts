import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './application/services/user.service';
import { UsersController } from './infrastructure/controllers/users.controller';
import { UserRepository } from './infrastructure/persistence/user.repository';
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [forwardRef(() => ChatModule)],
  controllers: [UsersController],
  providers: [
    UserService,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
  exports: [UserService, USER_REPOSITORY],
})
export class UsersModule {}
