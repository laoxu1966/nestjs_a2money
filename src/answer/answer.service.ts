import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Answer } from './answer.entity';
import { User } from '../user/user.entity';

import { CreateAnswerDto, UpdateAnswerDto } from './answer.dto';

@Injectable()
export class AnswerService {
  constructor(
    @InjectRepository(Answer)
    private answerRepository: Repository<Answer>,
  ) {}

  async createAnswer(
    user: User,
    createAnswerDto: CreateAnswerDto,
  ): Promise<any> {
    const answer = new Answer();
    Object.assign(answer, createAnswerDto);

    answer.uid = user.id;
    answer.profile = user.profile;

    return await this.answerRepository.save(answer);
  }

  async updateAnswer(
    user: User,
    updateAnswerDto: UpdateAnswerDto,
  ): Promise<any> {
    const answer = await this.answerRepository.findOne(updateAnswerDto.id);
    if (!answer || answer.uid != user.id) {
      throw new NotFoundException();
    }

    return await this.answerRepository.update(updateAnswerDto.id, {
      des: updateAnswerDto.des,
    });
  }

  async deleteAnswer(user: User, id: number): Promise<any> {
    const answer = await this.answerRepository.findOne(id);
    if (!answer || answer.uid != user.id) {
      throw new NotFoundException();
    }

    return await this.answerRepository.delete(id);
  }
}
