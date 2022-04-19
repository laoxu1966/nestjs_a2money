import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AbilityService } from './ability.service';
import { AbilityController } from './ability.controller';

import { Ability, Hot, Tag } from './ability.entity';
import { User } from '../user/user.entity';
import { Respond } from '../respond/respond.entity';
import { Favorite } from '../favorite/favorite.entity';

import { MqModule } from '../mq/mq.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MqModule,
    UserModule,
    CacheModule.register(),
    TypeOrmModule.forFeature([Ability, Respond, Hot, Tag, User, Favorite]),
  ],
  controllers: [AbilityController],
  providers: [AbilityService],
  exports: [AbilityService],
})
export class AbilityModule {}
