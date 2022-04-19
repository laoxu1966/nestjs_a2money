import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

import { MqProcessor } from './mq.processor';
import { MqService } from './mq.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'bull',
    }),
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: process.env.MAIL_TRANSPORT,
        defaults: {
          from: process.env.MAIL_FROM,
        },
        template: {
          dir: __dirname + '/views',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [MqService, MqProcessor],
  exports: [MqService],
})
export class MqModule {}
