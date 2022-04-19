import {
  Injectable,
  NotFoundException,
  NotAcceptableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult, UpdateResult, MoreThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

import * as fs from 'fs';

import { User } from '../user/user.entity';
import { Ability, Hot, Tag } from './ability.entity';
import { Respond } from '../respond/respond.entity';
import { Favorite } from '../favorite/favorite.entity';

import { MqService } from '../mq/mq.service';

import { CreateAbilityDto, UpdateAbilityDto } from './ability.dto';

@Injectable()
export class AbilityService {
  constructor(
    private mqService: MqService,
    @InjectRepository(Hot)
    private hotRepository: Repository<Hot>,
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
    @InjectRepository(Favorite)
    private favoriteRepository: Repository<Favorite>,
    @InjectRepository(Ability)
    private abilityRepository: Repository<Ability>,
    @InjectRepository(Respond)
    private respondRepository: Repository<Respond>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(paying: number, offset: number): Promise<Ability[]> {
    return await this.abilityRepository.find({
      where: { status: 1, paying: paying },
      order: {
        id: 'DESC',
      },
      skip: offset,
      take: 10,
    });
  }

  async findOne(id: number): Promise<Ability | undefined> {
    return await this.abilityRepository.findOne(id, {
      relations: ['responds'],
    });
  }

  async createAbility(
    user: User,
    createAbilityDto: CreateAbilityDto,
  ): Promise<Ability> {
    const ability = new Ability();
    Object.assign(ability, createAbilityDto);

    ability.uid = user.id;
    ability.profile = user.profile;

    return await this.abilityRepository.save(ability);
  }

  async updateAbility(
    user: User,
    updateAbilityDto: UpdateAbilityDto,
  ): Promise<UpdateResult> {
    const ability = await this.abilityRepository.findOne(updateAbilityDto.id);
    if (!ability || ability.uid != user.id) {
      throw new NotFoundException();
    }

    const files: string[] = JSON.parse(ability.files ?? '[]');
    files.forEach((file) => {
      if (updateAbilityDto.files.indexOf(file) == -1)
        if (file.startsWith('ability/') && fs.existsSync('public' + '/' + file))
          fs.unlinkSync('public' + '/' + file);
    });

    Object.assign(ability, updateAbilityDto);
    ability.status = 0;

    return await this.abilityRepository.update(updateAbilityDto.id, ability);
  }

  async deleteAbility(user: User, id: number): Promise<DeleteResult> {
    const ability = await this.abilityRepository.findOne(id, {
      relations: ['responds'],
    });
    if (!ability || ability.uid != user.id) {
      throw new NotFoundException();
    } else if (ability.responds.length > 0) {
      throw new NotAcceptableException();
    }

    const files: string[] = JSON.parse(ability.files ?? '[]');
    files.forEach((file) => {
      if (file.startsWith('ability/') && fs.existsSync('public' + '/' + file))
        fs.unlinkSync('public' + '/' + file);
    });

    return await this.abilityRepository.delete(id);
  }

  async search(
    match: number,
    paying: number,
    classification: number,
    sk: string,
    offset: number,
  ): Promise<Ability[] | any> {
    let matchStr = 'title,des';
    if (match == 1) matchStr = 'title';
    else if (match == 2) matchStr = 'des';

    let abilityQb = this.abilityRepository
      .createQueryBuilder('ability')
      .where('MATCH(' + matchStr + ') AGAINST (:value IN BOOLEAN MODE)', {
        value: sk,
      })
      .andWhere('ability.status = :status', { status: 1 });

    if (paying == 1 || paying == 2)
      abilityQb = abilityQb.andWhere('paying = :paying', {
        paying: paying - 1,
      });

    if (classification > 0)
      abilityQb = abilityQb.andWhere('classification = :classification', {
        classification: classification - 1,
      });

    abilityQb = abilityQb.orderBy('ability.id', 'DESC');

    this.hotRepository.query(
      'INSERT INTO hot (hot, created) VALUES(?, ?) ON DUPLICATE KEY UPDATE weight = weight + 1, created = ?',
      [sk, new Date(), new Date()],
    );

    return await abilityQb
      .setParameters(abilityQb.getParameters())
      .skip(offset)
      .take(10)
      .getMany();
  }

  async hot(): Promise<Hot[]> {
    return await this.hotRepository.find({
      where: { status: MoreThan(0) },
      order: {
        weight: 'DESC',
      },
      take: 99,
    });
  }

  async classification(
    classification: number,
    offset: number,
  ): Promise<Ability[]> {
    return await this.abilityRepository.find({
      where: { status: 1, classification: classification },
      order: {
        id: 'DESC',
      },
      skip: offset,
      take: 10,
    });
  }

  async tag(
    classification: number,
    tag: string,
    offset: number,
  ): Promise<Ability[]> {
    return await this.abilityRepository.find({
      where: { status: 1, classification: classification, tag: tag },
      order: {
        id: 'DESC',
      },
      skip: offset,
      take: 10,
    });
  }

  async classificationtag(): Promise<any[]> {
    interface RawModels {
      classification: string;
      tags: string;
    }

    const raws: RawModels[] = await this.tagRepository.query(
      'select classification,GROUP_CONCAT(tag order by weight desc) as tags from tag group by classification',
    );
    return raws.map((raw) => {
      raw.tags = raw['tags'].split(',').slice(0, 99).join(',');
      return raw;
    });
  }

  async myAbility(uid: number, offset: number): Promise<Ability[] | any> {
    return await this.abilityRepository.find({
      where: { uid: uid },
      order: {
        id: 'DESC',
      },
      skip: offset,
      take: 10,
    });
  }

  async myRespond(uid: number, offset: number): Promise<Ability[] | any> {
    const respondQb = this.respondRepository
      .createQueryBuilder('respond')
      .select('respond.abilityid')
      .where('respond.uid = :uid', { uid: uid });

    return await this.abilityRepository
      .createQueryBuilder('ability')
      .where('ability.id IN (' + respondQb.getQuery() + ')')
      .setParameters(respondQb.getParameters())
      .orderBy('ability.id', 'DESC')
      .skip(offset)
      .take(10)
      .getMany();
  }

  async myFavorite(uid: number, offset: number): Promise<Ability[] | any> {
    const favoriteQb = this.favoriteRepository
      .createQueryBuilder('favorite')
      .select('favorite.peer')
      .where('favorite.code = 0')
      .andWhere('favorite.uid = :uid', { uid: uid });

    return await this.abilityRepository
      .createQueryBuilder('ability')
      .where('ability.id IN (' + favoriteQb.getQuery() + ')')
      .setParameters(favoriteQb.getParameters())
      .orderBy('ability.id', 'DESC')
      .skip(offset)
      .take(10)
      .getMany();
  }

  async otherAbility(uid: number, offset: number): Promise<Ability[]> {
    return await this.abilityRepository.find({
      where: { status: 1, uid: uid },
      order: {
        id: 'DESC',
      },
      skip: offset,
      take: 10,
    });
  }

  async otherRespond(uid: number, offset: number): Promise<Ability[]> {
    const respondQb = this.respondRepository
      .createQueryBuilder('respond')
      .select('respond.abilityid')
      .where('respond.uid = :uid', { uid: uid });

    return await this.abilityRepository
      .createQueryBuilder('ability')
      .where('ability.id IN (' + respondQb.getQuery() + ')')
      .setParameters(respondQb.getParameters())
      .orderBy('ability.id', 'DESC')
      .skip(offset)
      .take(10)
      .getMany();
  }

  async otherMy(user: User, uid: number, offset: number): Promise<Ability[]> {
    const respondQb = this.respondRepository
      .createQueryBuilder('respond')
      .select('respond.abilityid')
      .where('respond.uid = :uid', { uid: user.id });

    return await this.abilityRepository
      .createQueryBuilder('ability')
      .where('ability.id IN (' + respondQb.getQuery() + ')')
      .andWhere('ability.uid = :uid', { uid: uid })
      .andWhere('ability.status = :status', { status: 1 })
      .setParameters(respondQb.getParameters())
      .orderBy('ability.id', 'DESC')
      .skip(offset)
      .take(10)
      .getMany();
  }

  async myOther(user: User, uid: number, offset: number): Promise<Ability[]> {
    const respondQb = this.respondRepository
      .createQueryBuilder('respond')
      .select('respond.abilityid')
      .where('respond.uid = :uid', { uid: uid });

    return await this.abilityRepository
      .createQueryBuilder('ability')
      .where('ability.id IN (' + respondQb.getQuery() + ')')
      .andWhere('ability.uid = :uid', { uid: user.id })
      .andWhere('ability.status = :status', { status: 1 })
      .setParameters(respondQb.getParameters())
      .orderBy('ability.id', 'DESC')
      .skip(offset)
      .take(10)
      .getMany();
  }

  async findOneAbility(): Promise<Ability | undefined> {
    return await this.abilityRepository.findOne({ status: 0 });
  }

  async updateOneAbility(
    id: number,
    status: number,
    hide: string,
  ): Promise<any> {
    const ability = await this.abilityRepository.findOne(id);
    if (!ability) {
      throw new NotFoundException();
    }

    if (status == 1) {
      await this.tagRepository.query(
        'INSERT INTO tag (classification, tag, created) VALUES(?, ?, ?) ON DUPLICATE KEY UPDATE weight = weight + 1, created = ?',
        [ability.classification, ability.tag, new Date(), new Date()],
      );

      return await this.abilityRepository.update(id, {
        status: status,
      });
    } else if (status == -1) {
      const user = await this.userRepository.findOne(ability.uid);
      if (!user) {
        throw new NotFoundException();
      }

      await this.mqService.addQueue('mail', {
        to: user.email,
        from: process.env.MAIL_FROM,
        subject: '能力变现交易 审查不通过',
        template: 'verifyAbility',
        context: {
          to: user.email,
          title: ability.title,
          hide: hide,
          created: new Date().toLocaleString(),
        },
      });

      return await this.abilityRepository.update(id, {
        status: status,
      });
    } else if (status == 0) {
      await this.userRepository.update(ability.uid, { role: -1 });
      return await this.abilityRepository.delete(id);
    }
  }

  async findOneHot(): Promise<Hot | undefined> {
    return await this.hotRepository.findOne({ status: 0 });
  }

  async updateHot(hot: string, status: number): Promise<UpdateResult> {
    return await this.hotRepository.update(hot, { status: status });
  }

  @Cron(CronExpression.EVERY_12_HOURS)
  async deleteHotCron() {
    await this.hotRepository
      .createQueryBuilder()
      .delete()
      .from(Hot)
      .where('status > :status', { status: -1 })
      .andWhere('TIMESTAMPDIFF(DAY, created, NOW()) > :days', { days: 30 })
      .execute();
  }

  @Cron(CronExpression.EVERY_12_HOURS)
  async deleteTagCron() {
    await this.tagRepository
      .createQueryBuilder()
      .delete()
      .from(Tag)
      .where('TIMESTAMPDIFF(DAY, created, NOW()) > :days', { days: 90 })
      .execute();
  }
}
