import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  Req,
  Res,
  UseGuards,
  SetMetadata,
  NotFoundException,
  PreconditionFailedException,
} from '@nestjs/common';
import { Response } from 'express';
//import { serialize } from 'class-transformer';

import { RoleGuard } from '../guard/role.guard';
import { HeaderGuard } from '../guard/header.guard';
import { AuthenticatedGuard } from '../guard/authenticated.guard';

import { Respond } from './respond.entity';

import { RespondService } from './respond.service';

import {
  CreateRespondDto,
  UpdateContractABDto,
  UpdateContractDto,
  UpdateSettlementABDto,
  UpdateSettlementDto,
  UpdateMemoDto,
} from './respond.dto';

@Controller('respond')
export class RespondController {
  constructor(private respondService: RespondService) {}

  @Get('findOne')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  async findOne(@Query('id') id: number): Promise<Respond | undefined> {
    return await this.respondService.findOne(id);
  }

  @Post('createRespond')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  async createRespond(
    @Req() req,
    @Body() createRespondDto: CreateRespondDto,
  ): Promise<any> {
    const sessioncaptcha = req.session.captcha;
    if (
      sessioncaptcha?.toUpperCase() != createRespondDto.captcha?.toUpperCase()
    ) {
      throw new PreconditionFailedException();
    }

    delete req.session.captcha;

    return await this.respondService.createRespond(req.user, createRespondDto);
  }

  @Post('updateContractAB')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  async updateContractAB(
    @Req() req,
    @Body() updateContractABDto: UpdateContractABDto,
  ): Promise<any> {
    return await this.respondService.updateContractAB(
      req.user,
      updateContractABDto,
    );
  }

  @Post('updateContract')
  @UseGuards(HeaderGuard, AuthenticatedGuard, RoleGuard)
  @SetMetadata('role', 0)
  async updateContract(
    @Req() req,
    @Body() updateContractDto: UpdateContractDto,
  ): Promise<any> {
    return await this.respondService.updateContract(
      req.user,
      updateContractDto,
    );
  }

  @Post('updateSettlementAB')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  async updateSettlementAB(
    @Req() req,
    @Body() updateSettlementABDto: UpdateSettlementABDto,
  ): Promise<any> {
    return await this.respondService.updateSettlementAB(
      req.user,
      updateSettlementABDto,
    );
  }

  @Post('updateSettlement')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  async updateSettlement(
    @Req() req,
    @Body() updateSettlementDto: UpdateSettlementDto,
  ): Promise<any> {
    return await this.respondService.updateSettlement(
      req.user,
      updateSettlementDto,
    );
  }

  @Post('updateMemo')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  async updateMemo(
    @Req() req,
    @Body() updateMemoDto: UpdateMemoDto,
  ): Promise<any> {
    return await this.respondService.updateMemo(req.user, updateMemoDto);
  }

  @Post('deleteRespond')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  async deleteRespond(@Req() req, @Body('id') id: number): Promise<any> {
    await this.respondService.deleteRespond(req.user, id);
  }

  @Get('renderOneRespond')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @SetMetadata('role', 3)
  async findOneRespond(@Res() res: Response) {
    const respond: Respond = await this.respondService.renderOneRespond();
    if (!respond) throw new NotFoundException();
    return res.render('respond', {
      respond: respond,
    });
  }

  @Post('updateOneSettlement')
  @UseGuards(AuthenticatedGuard, RoleGuard)
  @SetMetadata('role', 3)
  async updateOneSettlement(
    @Body('id') id: number,
    @Body('paying') paying: number,
    @Body('payable') payable: number,
    @Body('note') note: string,
    @Res() res: Response,
  ): Promise<any> {
    await this.respondService.updateOneSettlement(id, paying, payable, note);
    return res.redirect('renderOneRespond');
  }
}
