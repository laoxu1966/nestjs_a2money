import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Respond } from './respond.entity';
import { RespondService } from './respond.service';
import { RespondController } from './respond.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Respond])],
  providers: [RespondService],
  controllers: [RespondController],
  exports: [RespondService],
})
export class RespondModule {}
