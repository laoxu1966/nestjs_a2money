import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';

import { APP_GUARD } from '@nestjs/core';

import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ChatModule } from './chat/chat.module';
import { AbilityModule } from './ability/ability.module';
import { RespondModule } from './respond/respond.module';
import { UserModule } from './user/user.module';
import { TokenModule } from './token/token.module';
import { MqModule } from './mq/mq.module';
import { CaptchaModule } from './captcha/captcha.module';
import { MockModule } from './mock/mock.module';
import { FavoriteModule } from './favorite/favorite.module';
import { QuestionModule } from './question/question.module';
import { AnswerModule } from './answer/answer.module';

@Module({
  imports: [
    ChatModule,
    AbilityModule,
    RespondModule,
    UserModule,
    TokenModule,
    FavoriteModule,
    MockModule,
    MqModule,
    CaptchaModule,
    QuestionModule,
    AnswerModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [
        './secrets/alipay.env',
        './secrets/mysql.env',
        './secrets/redis.env',
        './secrets/mail.env',
        './secrets/sms.env',
      ],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'mysql',
        host: process.env.MYSQL_HOST,
        port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
        username: process.env.MYSQL_USERNAME,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        charset: 'utf8mb4',
        entities: ['dist/*/*.entity{.ts,.js}'],
        synchronize: true,
      }),
    }),
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        },
      }),
    }),
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 30,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
