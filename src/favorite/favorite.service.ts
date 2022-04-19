import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Repository, UpdateResult, DeleteResult } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Favorite } from './favorite.entity';
import { User } from '../user/user.entity';

import { CreateFavoriteDto, UpdateMemoDto } from './favorite.dto';

@Injectable()
export class FavoriteService {
  constructor(
    @InjectRepository(Favorite)
    private favoriteRepository: Repository<Favorite>,
  ) {}

  async findAll(code: number, uid: number): Promise<Favorite[]> {
    return await this.favoriteRepository.find({
      where: { code: code, uid: uid },
      order: {
        id: 'DESC',
      },
    });
  }

  async createFavorite(
    user: User,
    createFavoriteDto: CreateFavoriteDto,
  ): Promise<Favorite> {
    let favorite = await this.favoriteRepository.findOne({
      code: createFavoriteDto.code,
      peer: createFavoriteDto.peer,
      uid: user.id,
    });
    if (favorite) {
      throw new ConflictException();
    }

    favorite = new Favorite();
    Object.assign(favorite, createFavoriteDto);

    favorite.uid = user.id;

    return await this.favoriteRepository.save(favorite);
  }

  async updateMemo(
    user: User,
    updateMemoDto: UpdateMemoDto,
  ): Promise<UpdateResult> {
    const favorite = await this.favoriteRepository.findOne(
      updateMemoDto.favoriteid,
    );
    if (!favorite || favorite.uid != user.id) {
      throw new NotFoundException();
    }

    return await this.favoriteRepository.update(updateMemoDto.favoriteid, {
      memo: updateMemoDto.memo,
    });
  }

  async deleteFavorite(
    user: User,
    code: number,
    peer: number,
  ): Promise<DeleteResult> {
    const favorite = await this.favoriteRepository.findOne({
      code: code,
      peer: peer,
      uid: user.id,
    });
    if (!favorite) {
      throw new NotFoundException();
    }

    return await this.favoriteRepository.delete(favorite.id);
  }
}
