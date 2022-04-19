import {
  Injectable,
  NotFoundException,
  NotAcceptableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult, UpdateResult } from 'typeorm';

import * as fs from 'fs';

import { User } from '../user/user.entity';
import { Question } from './question.entity';
import { Answer } from '../answer/answer.entity';

import { MqService } from '../mq/mq.service';

import { CreateQuestionDto, UpdateQuestionDto } from './question.dto';

@Injectable()
export class QuestionService {
  constructor(
    private mqService: MqService,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Answer)
    private answerRepository: Repository<Answer>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(offset: number): Promise<Question[]> {
    return await this.questionRepository.find({
      where: { status: 1 },
      order: {
        id: 'DESC',
      },
      skip: offset,
      take: 10,
    });
  }

  async findOne(id: number): Promise<Question | undefined> {
    return await this.questionRepository.findOne(id, {
      relations: ['answers'],
    });
  }

  async createQuestion(
    user: User,
    createQuestionDto: CreateQuestionDto,
  ): Promise<any> {
    const question = new Question();
    Object.assign(question, createQuestionDto);

    question.uid = user.id;
    question.profile = user.profile;

    return await this.questionRepository.save(question);
  }

  async updateQuestion(
    user: User,
    updateQuestionDto: UpdateQuestionDto,
  ): Promise<UpdateResult> {
    const question = await this.questionRepository.findOne(
      updateQuestionDto.id,
    );
    if (!question || question.uid != user.id) {
      throw new NotFoundException();
    }

    const files: string[] = JSON.parse(question.files ?? '[]');
    files.forEach((file) => {
      if (updateQuestionDto.files.indexOf(file) == -1)
        if (
          file.startsWith('question/') &&
          fs.existsSync('public' + '/' + file)
        )
          fs.unlinkSync('public' + '/' + file);
    });

    Object.assign(question, updateQuestionDto);
    question.status = 0;

    return await this.questionRepository.update(updateQuestionDto.id, question);
  }

  async deleteQuestion(user: User, id: number): Promise<DeleteResult> {
    const question = await this.questionRepository.findOne(id, {
      relations: ['answers'],
    });
    if (!question || question.uid != user.id) {
      throw new NotFoundException();
    } else if (question.answers.length > 0) {
      throw new NotAcceptableException();
    }

    const files: string[] = JSON.parse(question.files ?? '[]');
    files.forEach((file) => {
      if (file.startsWith('question/') && fs.existsSync('public' + '/' + file))
        fs.unlinkSync('public' + '/' + file);
    });

    return await this.questionRepository.delete(id);
  }

  async search(
    match: number,
    classification: number,
    sk: string,
    offset: number,
  ): Promise<Question[] | any> {
    let matchStr = 'title,des';
    if (match == 1) matchStr = 'title';
    else if (match == 2) matchStr = 'des';

    let questionQb = this.questionRepository
      .createQueryBuilder('question')
      .where('MATCH(' + matchStr + ') AGAINST (:value IN BOOLEAN MODE)', {
        value: sk,
      })
      .andWhere('question.status = :status', { status: 1 });

    if (classification > 0)
      questionQb = questionQb.andWhere('classification = :classification', {
        classification: classification - 1,
      });

    questionQb = questionQb.orderBy('question.id', 'DESC');

    return await questionQb
      .setParameters(questionQb.getParameters())
      .skip(offset)
      .take(10)
      .getMany();
  }

  async classification(
    classification: number,
    offset: number,
  ): Promise<Question[]> {
    return await this.questionRepository.find({
      where: { status: 1, classification: classification },
      order: {
        id: 'DESC',
      },
      skip: offset,
      take: 10,
    });
  }

  async tag(
    classification: number,
    tag: string,
    offset: number,
  ): Promise<Question[]> {
    return await this.questionRepository.find({
      where: { status: 1, classification: classification, tag: tag },
      order: {
        id: 'DESC',
      },
      skip: offset,
      take: 10,
    });
  }

  async myQuestion(uid: number, offset: number): Promise<Question[] | any> {
    return await this.questionRepository.find({
      where: { uid: uid },
      order: {
        id: 'DESC',
      },
      skip: offset,
      take: 10,
    });
  }

  async myAnswer(uid: number, offset: number): Promise<Question[] | any> {
    const answerQb = this.answerRepository
      .createQueryBuilder('answer')
      .select('answer.questionid')
      .where('answer.uid = :uid', { uid: uid });

    return await this.questionRepository
      .createQueryBuilder('question')
      .where('question.id IN (' + answerQb.getQuery() + ')')
      .setParameters(answerQb.getParameters())
      .orderBy('question.id', 'DESC')
      .skip(offset)
      .take(10)
      .getMany();
  }

  async otherQuestion(uid: number, offset: number): Promise<Question[]> {
    return await this.questionRepository.find({
      where: { status: 1, uid: uid },
      order: {
        id: 'DESC',
      },
      skip: offset,
      take: 10,
    });
  }

  async otherAnswer(uid: number, offset: number): Promise<Question[]> {
    const answerQb = this.answerRepository
      .createQueryBuilder('answer')
      .select('answer.questionid')
      .where('answer.uid = :uid', { uid: uid });

    return await this.questionRepository
      .createQueryBuilder('question')
      .where('question.id IN (' + answerQb.getQuery() + ')')
      .setParameters(answerQb.getParameters())
      .orderBy('question.id', 'DESC')
      .skip(offset)
      .take(10)
      .getMany();
  }

  async findOneQuestion(): Promise<Question | undefined> {
    return await this.questionRepository.findOne({ status: 0 });
  }

  async updateOneQuestion(
    id: number,
    status: number,
    hide: string,
  ): Promise<any> {
    const question = await this.questionRepository.findOne(id);
    if (!question) {
      throw new NotFoundException();
    }

    if (status == 1) {
      return await this.questionRepository.update(id, {
        status: status,
      });
    } else if (status == -1) {
      const user = await this.userRepository.findOne(question.uid);
      if (!user) {
        throw new NotFoundException();
      }

      await this.mqService.addQueue('mail', {
        to: user.email,
        from: process.env.MAIL_FROM,
        subject: '能力知乎问题 审查不通过',
        template: 'verifyQuestion',
        context: {
          to: user.email,
          title: question.title,
          hide: hide,
          created: new Date().toLocaleString(),
        },
      });

      return await this.questionRepository.update(id, {
        status: status,
      });
    } else if (status == 0) {
      await this.userRepository.update(question.uid, { role: -1 });
      return await this.questionRepository.delete(id);
    }
  }
}
