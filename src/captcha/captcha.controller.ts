import { Controller, Get, Req, UseGuards } from '@nestjs/common';

import * as svgCaptcha from 'svg-captcha';

import { HeaderGuard } from '../guard/header.guard';

@Controller('captcha')
export class CaptchaController {
  @Get('getCaptcha')
  @UseGuards(HeaderGuard)
  async getCaptcha(@Req() req): Promise<any> {
    const captcha = svgCaptcha.create({
      size: 4,
      ignoreChars: '01oOiIl',
      noise: 4,
      color: false,
    });
    req.session.captcha = captcha.text;
    return { svg: captcha.data };
  }
}
