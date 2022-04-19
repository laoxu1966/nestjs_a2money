import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  PreconditionFailedException,
} from '@nestjs/common';

import { HeaderGuard } from '../guard/header.guard';
import { AuthenticatedGuard } from '../guard/authenticated.guard';

import { AnswerService } from './answer.service';

import { CreateAnswerDto, UpdateAnswerDto } from './answer.dto';

@Controller('answer')
export class AnswerController {
  constructor(private answerService: AnswerService) {}

  @Post('createAnswer')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  async createAnswer(
    @Req() req,
    @Body() createAnswerDto: CreateAnswerDto,
  ): Promise<any> {
    const sessioncaptcha = req.session.captcha;
    if (
      sessioncaptcha?.toUpperCase() != createAnswerDto.captcha?.toUpperCase()
    ) {
      throw new PreconditionFailedException();
    }

    delete req.session.captcha;

    return await this.answerService.createAnswer(req.user, createAnswerDto);
  }

  @Post('updateAnswer')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  async updateAnswer(
    @Req() req,
    @Body() updateAnswerDto: UpdateAnswerDto,
  ): Promise<any> {
    return await this.answerService.updateAnswer(req.user, updateAnswerDto);
  }

  @Post('deleteAnswer')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  async deleteQuestion(@Req() req, @Body('id') id: number): Promise<any> {
    return await this.answerService.deleteAnswer(req.user, id);
  }
}
