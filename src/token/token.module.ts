import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Token } from './token.entity';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';

import { Respond } from '../respond/respond.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Token, Respond])],
  controllers: [TokenController],
  providers: [TokenService],
})
export class TokenModule {}
