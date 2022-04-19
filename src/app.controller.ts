import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  SetMetadata,
} from '@nestjs/common';
import { Response } from 'express';

import { join } from 'path';

import { RoleGuard } from './guard/role.guard';
import { AuthenticatedGuard } from './guard/authenticated.guard';

@Controller()
export class AppController {
  [x: string]: any;
  @Get()
  async index(@Req() req, @Res() res: Response): Promise<any> {
    if (req.isAuthenticated()) {
      res.redirect('home');
    } else {
      res.redirect('user/login');
    }
  }

  @Get('home')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @SetMetadata('role', 3)
  async home(@Req() req, @Res() res: Response) {
    return res.render('home', {
      user: req.user,
    });
  }

  @Get('privacy')
  async privacy(@Res() res: Response) {
    return res.render('privacy', {});
  }

  @Get('download')
  async download(@Req() req, @Res() res: Response) {
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="a2money.apk"',
    });
    res.sendFile(join(__dirname, '..', 'public/apk/a2money.apk'));
  }

  @Get('version')
  async version(@Res() res: Response) {
    /*res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="a2money.apk"',
    });*/
    res.sendFile(join(__dirname, '..', 'public/apk/version.json'));
  }
}
