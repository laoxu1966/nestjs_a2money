import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';

import { HeaderGuard } from '../guard/header.guard';
import { AuthenticatedGuard } from '../guard/authenticated.guard';

import { Favorite } from './favorite.entity';
import { FavoriteService } from './favorite.service';

import { CreateFavoriteDto, UpdateMemoDto } from './favorite.dto';

@Controller('favorite')
export class FavoriteController {
  constructor(private favoriteService: FavoriteService) {}

  @Get('findAll')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  async findAll(
    @Query('code') code: number,
    @Query('uid') uid: number,
  ): Promise<Favorite[]> {
    return await this.favoriteService.findAll(code, uid);
  }

  @Post('createFavorite')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  async createFavorite(
    @Req() req,
    @Body() createFavoriteDto: CreateFavoriteDto,
  ): Promise<Favorite> {
    return await this.favoriteService.createFavorite(
      req.user,
      createFavoriteDto,
    );
  }

  @Post('updateMemo')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  async updateMemo(
    @Req() req,
    @Body() updateMemoDto: UpdateMemoDto,
  ): Promise<any> {
    return await this.favoriteService.updateMemo(req.user, updateMemoDto);
  }

  @Post('deleteFavorite')
  @UseGuards(HeaderGuard, AuthenticatedGuard)
  async deleteFavorite(
    @Req() req,
    @Body('code') code: number,
    @Body('peer') peer: number,
  ): Promise<any> {
    return await this.favoriteService.deleteFavorite(req.user, code, peer);
  }
}
