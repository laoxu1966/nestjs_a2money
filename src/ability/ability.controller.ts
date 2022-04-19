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
//import { serialize } from 'class-transformer';

import { RoleGuard } from '../guard/role.guard';
import { HeaderGuard } from '../guard/header.guard';
import { AuthenticatedGuard } from '../guard/authenticated.guard';

import { Ability, Hot } from './ability.entity';
import { AbilityService } from './ability.service';

import { CreateAbilityDto, UpdateAbilityDto } from './ability.dto';

@Controller('ability')
export class AbilityController {
  constructor(private abilityService: AbilityService) {}

  @Get('findAll')
  @UseGuards(HeaderGuard)
  @UseInterceptors(CacheInterceptor)
  async findAll(
    @Query('paying') paying: number,
    @Query('offset') offset: number,
  ): Promise<Ability[]> {
    return await this.abilityService.findAll(paying, offset);
  }

  @Get('findOne')
  @UseGuards(HeaderGuard)
  @UseInterceptors(CacheInterceptor)
  async findOne(@Query('id') id: number): Promise<Ability | undefined> {
    return await this.abilityService.findOne(id);
  }

  @Post('createAbility')
  @UseGuards(HeaderGuard, AuthenticatedGuard, RoleGuard)
  @SetMetadata('role', 0)
  @UseInterceptors(
    FilesInterceptor('files', 3, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const destination =
            'public' +
            '/' +
            'ability' +
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
  async createAbility(
    @Req() req,
    @Body() createAbilityDto: CreateAbilityDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<Ability> {
    const sessioncaptcha = req.session.captcha;
    if (
      sessioncaptcha?.toUpperCase() != createAbilityDto.captcha?.toUpperCase()
    ) {
      throw new PreconditionFailedException();
    }

    delete req.session.captcha;

    const destination = 'ability' + '/' + Math.floor(req.user.id / 1000) + '/';
    let pics = [];
    if (createAbilityDto.pics) pics = createAbilityDto.pics.split(',');
    files.forEach((file) => {
      pics.push(destination + file.filename);
    });
    createAbilityDto.files = JSON.stringify(pics);

    return await this.abilityService.createAbility(req.user, createAbilityDto);
  }

  @Post('updateAbility')
  @UseGuards(HeaderGuard, AuthenticatedGuard, RoleGuard)
  @SetMetadata('role', 0)
  @UseInterceptors(
    FilesInterceptor('files', 3, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const destination =
            'public' +
            '/' +
            'ability' +
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
  async updateAbility(
    @Req() req,
    @Body() updateAbilityDto: UpdateAbilityDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<any> {
    const destination = 'ability' + '/' + Math.floor(req.user.id / 1000) + '/';
    let pics = [];
    if (updateAbilityDto.pics) pics = updateAbilityDto.pics.split(',');
    files.forEach((file) => {
      pics.push(destination + file.filename);
    });
    updateAbilityDto.files = JSON.stringify(pics);
    delete updateAbilityDto.pics;

    return await this.abilityService.updateAbility(req.user, updateAbilityDto);
  }

  @Post('deleteAbility')
  @UseGuards(HeaderGuard, AuthenticatedGuard, RoleGuard)
  @SetMetadata('role', 0)
  async deleteAbility(@Req() req, @Body('id') id: number): Promise<any> {
    return await this.abilityService.deleteAbility(req.user, id);
  }

  @Get('search')
  @UseGuards(HeaderGuard)
  @UseInterceptors(CacheInterceptor)
  async search(
    @Query('match') match: number,
    @Query('paying') paying: number,
    @Query('classification') classification: number,
    @Query('sk') sk: string,
    @Query('offset') offset: number,
  ): Promise<Ability[]> {
    return await this.abilityService.search(
      match,
      paying,
      classification,
      sk,
      offset,
    );
  }

  @Get('classification')
  @UseGuards(HeaderGuard)
  @UseInterceptors(CacheInterceptor)
  async classification(
    @Query('classification') classification: number,
    @Query('offset') offset: number,
  ): Promise<Ability[]> {
    return await this.abilityService.classification(classification, offset);
  }

  @Get('tag')
  @UseGuards(HeaderGuard)
  @UseInterceptors(CacheInterceptor)
  async tag(
    @Query('classification') classification: number,
    @Query('tag') tag: string,
    @Query('offset') offset: number,
  ): Promise<Ability[]> {
    return await this.abilityService.tag(classification, tag, offset);
  }

  @Get('classificationtag')
  @UseGuards(HeaderGuard)
  @UseInterceptors(CacheInterceptor)
  async classificationtag() {
    return await this.abilityService.classificationtag();
  }

  @Get('hot')
  @UseGuards(HeaderGuard)
  @UseInterceptors(CacheInterceptor)
  async hot(): Promise<any> {
    return await this.abilityService.hot();
  }

  @Get('myAbility')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  @UseInterceptors(CacheInterceptor)
  async myAbility(
    @Query('uid') uid: number,
    @Query('offset') offset: number,
  ): Promise<Ability[]> {
    return await this.abilityService.myAbility(uid, offset);
  }

  @Get('myRespond')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  @UseInterceptors(CacheInterceptor)
  async myRespond(
    @Query('uid') uid: number,
    @Query('offset') offset: number,
  ): Promise<Ability[]> {
    return await this.abilityService.myRespond(uid, offset);
  }

  @Get('myFavorite')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  async myFavorite(
    @Query('uid') uid: number,
    @Query('offset') offset: number,
  ): Promise<Ability[]> {
    return await this.abilityService.myFavorite(uid, offset);
  }

  @Get('otherAbility')
  @UseGuards(HeaderGuard)
  @UseInterceptors(CacheInterceptor)
  async otherAbility(
    @Query('uid') uid: number,
    @Query('offset') offset: number,
  ): Promise<Ability[]> {
    return await this.abilityService.otherAbility(uid, offset);
  }

  @Get('otherRespond')
  @UseGuards(HeaderGuard)
  @UseInterceptors(CacheInterceptor)
  async otherRespond(
    @Query('uid') uid: number,
    @Query('offset') offset: number,
  ): Promise<Ability[]> {
    return await this.abilityService.otherRespond(uid, offset);
  }

  @Get('otherMy')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  @UseInterceptors(CacheInterceptor)
  async otherMy(
    @Req() req,
    @Query('uid') uid: number,
    @Query('offset') offset: number,
  ): Promise<Ability[]> {
    return await this.abilityService.otherMy(req.user, uid, offset);
  }

  @Get('myOther')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  @UseInterceptors(CacheInterceptor)
  async myOther(
    @Req() req,
    @Query('uid') uid: number,
    @Query('offset') offset: number,
  ): Promise<Ability[]> {
    return await this.abilityService.myOther(req.user, uid, offset);
  }

  @Get('findOneAbility')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @SetMetadata('role', 3)
  async findOneAbility(@Res() res: Response) {
    const ability: Ability = await this.abilityService.findOneAbility();
    if (!ability) throw new NotFoundException();
    return res.render('ability', {
      ability: ability,
    });
  }

  @Post('updateOneAbility')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @SetMetadata('role', 3)
  async updateOneAbility(
    @Body('id') id: number,
    @Body('status') status: number,
    @Body('hide') hide: string,
    @Res() res: Response,
  ): Promise<any> {
    await this.abilityService.updateOneAbility(id, status, hide);
    return res.redirect('findOneAbility');
  }

  @Get('renderOneAbility')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @SetMetadata('role', 3)
  async renderOneAbility(
    @Query('paying') paying: number,
    @Req() req,
    @Res() res: Response,
  ) {
    return res.render('createAbility', {
      paying: paying,
      uid: req.user.id,
    });
  }

  @Post('createOneAbility')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @SetMetadata('role', 3)
  @UseInterceptors(
    FilesInterceptor('files', 3, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const destination =
            'public' +
            '/' +
            'ability' +
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
  async createOneAbility(
    @Req() req,
    @Body() createAbilityDto: CreateAbilityDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<Ability> {
    const destination = 'ability' + '/' + Math.floor(req.user.id / 1000) + '/';
    const pics = [];
    files.forEach((file) => {
      pics.push(destination + file.filename);
    });
    createAbilityDto.files = JSON.stringify(pics);

    return await this.abilityService.createAbility(req.user, createAbilityDto);
  }

  @Get('findOneHot')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @SetMetadata('role', 3)
  async findOneHot(@Res() res: Response) {
    const hot: Hot = await this.abilityService.findOneHot();
    if (!hot) throw new NotFoundException();
    return res.render('hot', {
      hot: hot,
    });
  }

  @Post('updateHot')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @SetMetadata('role', 3)
  async updateHot(
    @Body('hot') hot: string,
    @Body('status') status: number,
    @Res() res: Response,
  ): Promise<any> {
    await this.abilityService.updateHot(hot, status);
    return res.redirect('findOneHot');
  }
}
