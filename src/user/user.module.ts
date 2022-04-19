import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';

import { LocalStrategy } from '../passport/local.strategy';
import { SessionSerializer } from '../passport/session.serializer';

import { MqModule } from '../mq/mq.module';

import { User } from './user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  imports: [
    MqModule,
    PassportModule.register({
      defaultStrategy: 'local',
      session: true,
    }),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [UserController],
  providers: [UserService, LocalStrategy, SessionSerializer],
  exports: [UserService],
})
export class UserModule {}
