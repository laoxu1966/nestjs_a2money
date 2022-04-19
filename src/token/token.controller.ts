import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  Get,
  UseGuards,
  Query,
} from '@nestjs/common';
import { Response } from 'express';

import { HeaderGuard } from '../guard/header.guard';
import { AuthenticatedGuard } from '../guard/authenticated.guard';

import { Token } from './token.entity';
import { TokenService } from './token.service';

@Controller('token')
export class TokenController {
  constructor(private tokenService: TokenService) {}

  @Get('findAll')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  async findAll(@Req() req, @Query('uid') uid: number): Promise<Token[]> {
    return await this.tokenService.findAll(req.user, uid);
  }

  @Post('freeze')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  async freeze(@Req() req, @Body('tokenid') tokenid: number): Promise<any> {
    return await this.tokenService.freeze(req.user, req.headers.host, tokenid);
  }

  @Post('freezeNotify')
  async freezeNotify(@Body() body: any, @Res() res: Response): Promise<any> {
    const success: boolean = await this.tokenService.freezeNotify(body);
    if (success) {
      res.send('success');
    } else {
      res.send('failure');
    }
  }

  @Post('unfreezeorpay')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  async unfreezeorpay(
    @Req() req,
    @Body('respondid') respondid: number,
    @Body('tokenid') tokenid: number,
  ): Promise<any> {
    return await this.tokenService.unfreezeorpay(req.user, respondid, tokenid);
  }

  @Post('trans')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  async trans(
    @Req() req,
    @Body('respondid') respondid: number,
    @Body('tokenid') tokenid: number,
  ): Promise<any> {
    return await this.tokenService.trans(req.user, respondid, tokenid);
  }
}
