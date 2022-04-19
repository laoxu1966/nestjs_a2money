import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class MqService {
  constructor(
    @InjectQueue('bull')
    private readonly bullQueue: Queue,
  ) {}

  async addQueue(name: string, data: any): Promise<any> {
    return await this.bullQueue.add(name, data);
  }
}
