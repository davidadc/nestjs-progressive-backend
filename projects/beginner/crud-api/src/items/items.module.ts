import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { ItemsRepository } from './items.repository';
import { ITEMS_REPOSITORY } from './items.repository.interface';

@Module({
  controllers: [ItemsController],
  providers: [
    ItemsService,
    {
      provide: ITEMS_REPOSITORY,
      useClass: ItemsRepository,
    },
  ],
  exports: [ItemsService],
})
export class ItemsModule {}
