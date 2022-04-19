import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  Render,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  PayloadTooLargeException,
  PreconditionFailedException,
} from '@nestjs/common';
import { Response } from 'express';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';

import { LoginGuard } from '../guard/login.guard';
import { HeaderGuard } from '../guard/header.guard';
import { AuthenticatedGuard } from '../guard/authenticated.guard';

import { MqService } from '../mq/mq.service';
import { UserService } from './user.service';

import {
  CreateUserDto,
  UpdateUsernameDto,
  UpdatePasswordDto,
  ResetPasswordDto,
  UpdateProfileDto,
  UpdateEmailDto,
  UpdateTelDto,
} from './user.dto';

@Controller('user')
export class UserController {
  constructor(private mqService: MqService, private userService: UserService) {}

  @Get('login')
  @Render('login')
  async login(): Promise<void> {
    //return {};
  }

  @Get('reset')
  @Render('reset')
  async reset(): Promise<void> {
    //return {};
  }

  @Get('currentUser')
  async currentUser(@Req() req): Promise<any> {
    const isAuthenticated = await req.isAuthenticated();

    if (!isAuthenticated) {
      return {
        isAuthenticated,
      };
    }

    return {
      isAuthenticated,
      user: req.user,
    };
  }

  @UseGuards(LoginGuard)
  @Post('signin')
  async signin(@Res() res: Response): Promise<any> {
    res.redirect('/');
  }

  @Post('signout')
  @UseGuards(AuthenticatedGuard)
  async signout(@Body('id') id: number): Promise<any> {
    await this.userService.signout(id);
  }

  @Post('logout')
  //@UseGuards(AuthenticatedGuard)
  async logout(@Req() req, @Res() res: Response): Promise<any> {
    await req.logout();
    res.redirect('/');
  }

  @Post('createUser')
  @UseGuards(HeaderGuard)
  async createUser(
    @Req() req,
    @Body() createUserDto: CreateUserDto,
  ): Promise<any> {
    return await this.userService.createUser(createUserDto);
  }

  @Post('resetPassword')
  @UseGuards(HeaderGuard)
  async resetPassword(
    @Req() req,
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<any> {
    const username = req.session.username;
    const hash = req.session.hash;
    if (
      username?.toUpperCase() != resetPasswordDto.username?.toUpperCase() ||
      hash?.toUpperCase() != resetPasswordDto.hash?.toUpperCase()
    ) {
      throw new PreconditionFailedException();
    }

    delete req.session.username;
    delete req.session.hash;

    return await this.userService.resetPassword(resetPasswordDto);
  }

  @Post('updatePassword')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  async updatePassword(
    @Req() req,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ): Promise<any> {
    await this.userService.updatePassword(req.user, updatePasswordDto);
  }

  @Post('updateProfile')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const destination =
            'public' +
            '/' +
            'avatar' +
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
  async updateProfile(
    @Req() req,
    @Body() updateProfileDto: UpdateProfileDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    if (file) {
      const destination = 'avatar' + '/' + Math.floor(req.user.id / 1000) + '/';
      const profile = JSON.parse(updateProfileDto.profile ?? '{}');
      profile.avatar = destination + file.filename;
      updateProfileDto.profile = JSON.stringify(profile);
    }

    return await this.userService.updateProfile(req.user, updateProfileDto);
  }

  @Post('updateUsername')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  async updateUsername(
    @Req() req,
    @Body() updateUsernameDto: UpdateUsernameDto,
  ): Promise<any> {
    await this.userService.updateUsername(req.user, updateUsernameDto);
  }

  @Post('updateEmail')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  async updateEmail(
    @Req() req,
    @Body() updateEmailDto: UpdateEmailDto,
  ): Promise<any> {
    const email = req.session.email;
    const hash = req.session.hash;
    if (
      hash?.toUpperCase() != updateEmailDto.hash?.toUpperCase() ||
      email?.toUpperCase() != updateEmailDto.email?.toUpperCase()
    ) {
      throw new PreconditionFailedException();
    }

    delete req.session.email;
    delete req.session.hash;

    await this.userService.updateEmail(req.user, updateEmailDto);
  }

  @Post('updateTel')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  async updateTel(
    @Req() req,
    @Body() updateTelDto: UpdateTelDto,
  ): Promise<any> {
    const tel = req.session.tel;
    const hash = req.session.hash;
    if (
      hash?.toUpperCase() != updateTelDto.hash?.toUpperCase() ||
      tel?.toUpperCase() != updateTelDto.tel?.toUpperCase()
    ) {
      throw new PreconditionFailedException();
    }

    delete req.session.tel;
    delete req.session.hash;

    await this.userService.updateTel(req.user, updateTelDto);
  }

  @Post('verifyEmail')
  @UseGuards(HeaderGuard)
  async verifyEmail(@Req() req, @Body('email') email: string): Promise<any> {
    req.session.email = email;
    req.session.hash = Math.random().toString(10).slice(-6);

    await this.mqService.addQueue('mail', {
      to: req.session.email,
      from: process.env.MAIL_FROM,
      subject: '能力变现平台 验证码/verification code',
      template: 'verifyEmail',
      context: {
        to: req.session.email,
        hash: req.session.hash,
        created: new Date().toLocaleString(),
      },
    });

    return {};
  }

  @Post('verifyTel')
  @UseGuards(HeaderGuard)
  async verifyTel(@Req() req, @Body('tel') tel: string): Promise<any> {
    const last: number = req.session.last ?? Date.parse('2000-1-1');
    if (Date.now() - last < 1000 * 60 * 60)
      throw new PayloadTooLargeException();

    req.session.last = Date.now();
    req.session.tel = tel;
    req.session.hash = Math.random().toString(10).slice(-6);

    await this.mqService.addQueue('sms', {
      tel: req.session.tel,
      code: req.session.hash,
    });

    return {};
  }
}
