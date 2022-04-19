import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  Query,
  UseGuards,
  SetMetadata,
  UseInterceptors,
  UploadedFiles,
  CacheInterceptor,
  NotFoundException,
  PreconditionFailedException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';

import { Response } from 'express';

import { RoleGuard } from '../guard/role.guard';
import { HeaderGuard } from '../guard/header.guard';
import { AuthenticatedGuard } from '../guard/authenticated.guard';

import { Question } from './question.entity';
import { QuestionService } from './question.service';

import { CreateQuestionDto, UpdateQuestionDto } from './question.dto';

@Controller('question')
export class QuestionController {
  constructor(private questionService: QuestionService) {}

  @Get('findAll')
  @UseGuards(HeaderGuard)
  @UseInterceptors(CacheInterceptor)
  async findAll(@Query('offset') offset: number): Promise<Question[]> {
    return await this.questionService.findAll(offset);
  }

  @Get('findOne')
  @UseGuards(HeaderGuard)
  @UseInterceptors(CacheInterceptor)
  async findOne(@Query('id') id: number): Promise<Question | undefined> {
    return await this.questionService.findOne(id);
  }

  @Post('createQuestion')
  @UseGuards(HeaderGuard, AuthenticatedGuard, RoleGuard)
  @SetMetadata('role', 0)
  @UseInterceptors(
    FilesInterceptor('files', 3, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const destination =
            'public' +
            '/' +
            'question' +
            '/' +
            Math.floor(req.body.uid / 1000) +
            '/';
          if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination);
          }
          cb(null, destination);
        },
        filename: (req, file, cb) => {
          const filename = `${Date.now().toString()}.${
            file.mimetype.split('/')[1]
          }`;
          cb(null, filename);
        },
      }),
    }),
  )
  async createQuestion(
    @Req() req,
    @Body() createQuestionDto: CreateQuestionDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<Question> {
    const sessioncaptcha = req.session.captcha;
    if (
      sessioncaptcha?.toUpperCase() != createQuestionDto.captcha?.toUpperCase()
    ) {
      throw new PreconditionFailedException();
    }

    delete req.session.captcha;

    const destination = 'question' + '/' + Math.floor(req.user.id / 1000) + '/';
    let pics = [];
    if (createQuestionDto.pics) pics = createQuestionDto.pics.split(',');
    files.forEach((file) => {
      pics.push(destination + file.filename);
    });
    createQuestionDto.files = JSON.stringify(pics);

    return await this.questionService.createQuestion(
      req.user,
      createQuestionDto,
    );
  }

  @Post('updateQuestion')
  @UseGuards(HeaderGuard, AuthenticatedGuard, RoleGuard)
  @SetMetadata('role', 0)
  @UseInterceptors(
    FilesInterceptor('files', 3, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const destination =
            'public' +
            '/' +
            'question' +
            '/' +
            Math.floor(req.body.uid / 1000) +
            '/';
          if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination);
          }
          cb(null, destination);
        },
        filename: (req, file, cb) => {
          const filename = `${Date.now().toString()}.${
            file.mimetype.split('/')[1]
          }`;
          cb(null, filename);
        },
      }),
    }),
  )
  async updateQuestion(
    @Req() req,
    @Body() updateQuestionDto: UpdateQuestionDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<any> {
    const destination = 'question' + '/' + Math.floor(req.user.id / 1000) + '/';
    let pics = [];
    if (updateQuestionDto.pics) pics = updateQuestionDto.pics.split(',');
    files.forEach((file) => {
      pics.push(destination + file.filename);
    });
    updateQuestionDto.files = JSON.stringify(pics);
    delete updateQuestionDto.pics;

    return await this.questionService.updateQuestion(
      req.user,
      updateQuestionDto,
    );
  }

  @Post('deleteQuestion')
  @UseGuards(HeaderGuard, AuthenticatedGuard, RoleGuard)
  @SetMetadata('role', 0)
  async deleteQuestion(@Req() req, @Body('id') id: number): Promise<any> {
    return await this.questionService.deleteQuestion(req.user, id);
  }

  @Get('search')
  @UseGuards(HeaderGuard)
  @UseInterceptors(CacheInterceptor)
  async search(
    @Query('match') match: number,
    @Query('classification') classification: number,
    @Query('sk') sk: string,
    @Query('offset') offset: number,
  ): Promise<Question[]> {
    return await this.questionService.search(match, classification, sk, offset);
  }

  @Get('classification')
  @UseGuards(HeaderGuard)
  @UseInterceptors(CacheInterceptor)
  async classification(
    @Query('classification') classification: number,
    @Query('offset') offset: number,
  ): Promise<Question[]> {
    return await this.questionService.classification(classification, offset);
  }

  @Get('tag')
  @UseGuards(HeaderGuard)
  @UseInterceptors(CacheInterceptor)
  async tag(
    @Query('classification') classification: number,
    @Query('tag') tag: string,
    @Query('offset') offset: number,
  ): Promise<Question[]> {
    return await this.questionService.tag(classification, tag, offset);
  }

  @Get('myQuestion')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  @UseInterceptors(CacheInterceptor)
  async myQuestion(
    @Query('uid') uid: number,
    @Query('offset') offset: number,
  ): Promise<Question[]> {
    return await this.questionService.myQuestion(uid, offset);
  }

  @Get('myAnswer')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  @UseInterceptors(CacheInterceptor)
  async myAnswer(
    @Query('uid') uid: number,
    @Query('offset') offset: number,
  ): Promise<Question[]> {
    return await this.questionService.myAnswer(uid, offset);
  }

  @Get('otherQuestion')
  @UseGuards(HeaderGuard)
  @UseInterceptors(CacheInterceptor)
  async otherAbility(
    @Query('uid') uid: number,
    @Query('offset') offset: number,
  ): Promise<Question[]> {
    return await this.questionService.otherQuestion(uid, offset);
  }

  @Get('otherAnswer')
  @UseGuards(HeaderGuard)
  @UseInterceptors(CacheInterceptor)
  async otherRespond(
    @Query('uid') uid: number,
    @Query('offset') offset: number,
  ): Promise<Question[]> {
    return await this.questionService.otherAnswer(uid, offset);
  }

  @Get('findOneQuestion')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @SetMetadata('role', 3)
  async findOneQuestion(@Res() res: Response) {
    const question: Question = await this.questionService.findOneQuestion();
    if (!question) throw new NotFoundException();
    return res.render('question', {
      question: question,
    });
  }

  @Post('updateOneQuestion')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @SetMetadata('role', 3)
  async updateOneQuestion(
    @Body('id') id: number,
    @Body('status') status: number,
    @Body('hide') hide: string,
    @Res() res: Response,
  ): Promise<any> {
    await this.questionService.updateOneQuestion(id, status, hide);
    return res.redirect('findOneQuestion');
  }

  @Get('renderOneQuestion')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @SetMetadata('role', 3)
  async renderOneQuestion(@Req() req, @Res() res: Response) {
    return res.render('createQuestion', {
      uid: req.user.id,
    });
  }

  @Post('createOneQuestion')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @SetMetadata('role', 3)
  @UseInterceptors(
    FilesInterceptor('files', 3, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const destination =
            'public' +
            '/' +
            'question' +
            '/' +
            Math.floor(req.body.uid / 1000) +
            '/';
          if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination);
          }
          cb(null, destination);
        },
        filename: (req, file, cb) => {
          const filename = `${Date.now().toString()}.${
            file.mimetype.split('/')[1]
          }`;
          cb(null, filename);
        },
      }),
    }),
  )
  async createOneQuestion(
    @Req() req,
    @Body() createQuestionDto: CreateQuestionDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<Question> {
    const destination = 'question' + '/' + Math.floor(req.user.id / 1000) + '/';
    const pics = [];
    files.forEach((file) => {
      pics.push(destination + file.filename);
    });
    createQuestionDto.files = JSON.stringify(pics);

    return await this.questionService.createQuestion(
      req.user,
      createQuestionDto,
    );
  }
}
