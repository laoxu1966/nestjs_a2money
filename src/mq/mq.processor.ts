import { Job } from 'bull';
import { MailerService } from '@nestjs-modules/mailer';
import { Process as BullProcess, Processor } from '@nestjs/bull';

import Dysmsapi20170525, * as $Dysmsapi20170525 from '@alicloud/dysmsapi20170525';
import * as $OpenApi from '@alicloud/openapi-client';

@Processor('bull')
export class MqProcessor {
  constructor(private mailerService: MailerService) {}

  @BullProcess('mail')
  async mailHandle(job: Job) {
    this.mailerService.sendMail({
      to: job.data.to,
      from: job.data.from,
      subject: job.data.subject,
      template: job.data.template,
      context: job.data.context,
    });
  }

  @BullProcess('sms')
  async smsHandle(job: Job) {
    const config = new $OpenApi.Config({
      accessKeyId: process.env.AccessKey,
      accessKeySecret: process.env.AccessKey_Secret,
      endpoint: 'dysmsapi.aliyuncs.com',
    });

    const smsClient = new Dysmsapi20170525(config);

    const params = {
      phoneNumbers: job.data.tel,
      signName: '能力变现平台',
      templateCode: 'SMS_229640758',
      templateParam: JSON.stringify({ code: job.data.code }),
    };

    const sendSmsRequest = new $Dysmsapi20170525.SendSmsRequest(params);

    await smsClient.sendSms(sendSmsRequest);
  }
}
