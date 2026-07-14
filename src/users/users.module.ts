import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { BuyersController } from '../buyers/buyers.controller';

@Module({
  controllers: [UsersController, BuyersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
