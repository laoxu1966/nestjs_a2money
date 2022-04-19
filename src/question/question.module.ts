import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';

import { Question } from './question.entity';
import { User } from '../user/user.entity';
import { Answer } from '../answer/answer.entity';

import { MqModule } from '../mq/mq.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MqModule,
    UserModule,
    CacheModule.register(),
    TypeOrmModule.forFeature([Question, Answer, User]),
  ],
  controllers: [QuestionController],
  providers: [QuestionService],
  exports: [QuestionService],
})
export class QuestionModule {}
