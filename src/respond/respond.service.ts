import {
  Injectable,
  NotFoundException,
  NotAcceptableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { Connection } from 'typeorm';

import { Respond } from './respond.entity';
import { User } from '../user/user.entity';
import { Token } from '../token/token.entity';

import {
  CreateRespondDto,
  UpdateContractABDto,
  UpdateContractDto,
  UpdateSettlementABDto,
  UpdateSettlementDto,
  UpdateMemoDto,
} from './respond.dto';

@Injectable()
export class RespondService {
  constructor(
    private connection: Connection,
    @InjectRepository(Respond)
    private respondRepository: Repository<Respond>,
  ) {}

  async findOne(id: number): Promise<Respond> {
    const respond = await this.respondRepository.findOne(id, {
      relations: ['tokens'],
    });
    if (!respond) {
      throw new NotFoundException();
    }
    return respond;
  }

  async createRespond(
    user: User,
    createRespondDto: CreateRespondDto,
  ): Promise<any> {
    const respond = new Respond();
    Object.assign(respond, createRespondDto);

    respond.uid = user.id;
    respond.profile = user.profile;

    return await this.respondRepository.save(respond);
  }

  async deleteRespond(user: User, id: number): Promise<any> {
    const respond = await this.respondRepository.findOne(id);
    if (!respond || respond.uid != user.id) {
      throw new NotFoundException();
    } else if (respond.contract != '{}') {
      throw new NotAcceptableException();
    }

    return await this.respondRepository.delete(id);
  }

  async updateContractAB(
    user: User,
    updateContractABDto: UpdateContractABDto,
  ): Promise<any> {
    const respond = await this.respondRepository.findOne(
      updateContractABDto.id,
    );
    if (!respond || (respond.uid != user.id && respond.abilityuid != user.id)) {
      throw new NotFoundException();
    }

    const partialEntity: any = {};

    if (respond.abilityuid == user.id) {
      partialEntity.contractA = updateContractABDto.contractAB;
    } else if (respond.uid == user.id) {
      partialEntity.contractB = updateContractABDto.contractAB;
    }

    return await this.respondRepository.update(
      updateContractABDto.id,
      partialEntity,
    );
  }

  async updateContract(
    user: User,
    updateContractDto: UpdateContractDto,
  ): Promise<any> {
    const respond = await this.respondRepository.findOne(updateContractDto.id, {
      relations: ['tokens'],
    });
    if (!respond || (respond.uid != user.id && respond.abilityuid != user.id)) {
      throw new NotFoundException();
    }

    const contract = JSON.parse(updateContractDto.contract ?? '{}');
    const payable = contract.payable;

    let freeze = 0.0;
    respond.tokens.forEach((element) => {
      if (element.uid == user.id) freeze = freeze + element.freeze;
    });

    return await this.connection.transaction(async (manager) => {
      manager.update(Respond, updateContractDto.id, {
        contract: updateContractDto.contract,
        contractA: '{}',
        contractB: '{}',
      });

      if (payable > freeze) {
        const peerid = Date.now().toString();

        manager.insert(Token, {
          abilityid: respond.abilityid,
          respondid: respond.id,
          peerid,
          payable: payable - freeze,
          uid: respond.abilityuid,
        });

        manager.insert(Token, {
          abilityid: respond.abilityid,
          respondid: respond.id,
          peerid,
          payable: payable - freeze,
          uid: respond.uid,
        });
      }
    });
  }

  async updateSettlementAB(
    user: User,
    updateSettlementABDto: UpdateSettlementABDto,
  ): Promise<UpdateResult> {
    const respond = await this.respondRepository.findOne(
      updateSettlementABDto.id,
    );
    if (!respond || (respond.uid != user.id && respond.abilityuid != user.id)) {
      throw new NotFoundException();
    }

    const partialEntity: any = {};

    if (respond.abilityuid == user.id) {
      partialEntity.settlementA = updateSettlementABDto.settlementAB;
    } else if (respond.uid == user.id) {
      partialEntity.settlementB = updateSettlementABDto.settlementAB;
    }

    if (updateSettlementABDto.settlementAB == '{}') partialEntity.status = 0;
    else partialEntity.status = -1;

    return await this.respondRepository.update(
      updateSettlementABDto.id,
      partialEntity,
    );
  }

  async updateSettlement(
    user: User,
    updateSettlementDto: UpdateSettlementDto,
  ): Promise<any> {
    const respond = await this.respondRepository.findOne(
      updateSettlementDto.id,
      {
        relations: ['tokens'],
      },
    );
    if (!respond || (respond.uid != user.id && respond.abilityuid != user.id)) {
      throw new NotFoundException();
    }

    const settlement = JSON.parse(updateSettlementDto.settlement ?? '{}');
    const payable = settlement.payable;

    let freeze = 0.0;
    respond.tokens.forEach((element) => {
      if (element.uid == user.id) freeze = freeze + element.freeze;
    });

    return await this.connection.transaction(async (manager) => {
      manager.update(Respond, updateSettlementDto.id, {
        settlement: updateSettlementDto.settlement,
        settlementA: '{}',
        settlementB: '{}',
        status: 0,
      });

      if (payable > freeze) {
        const peerid = Date.now().toString();

        manager.insert(Token, {
          respondid: respond.id,
          peerid,
          payable: payable - freeze,
          uid: respond.abilityuid,
        });

        manager.insert(Token, {
          respondid: respond.id,
          peerid,
          payable: payable - freeze,
          uid: respond.uid,
        });
      }
    });
  }

  async updateMemo(
    user: User,
    updateMemoDto: UpdateMemoDto,
  ): Promise<UpdateResult> {
    const respond = await this.respondRepository.findOne(updateMemoDto.id);
    if (!respond || respond.abilityuid != user.id) {
      throw new NotFoundException();
    }

    return await this.respondRepository.update(updateMemoDto.id, {
      memo: updateMemoDto.memo,
    });
  }

  async renderOneRespond(): Promise<Respond | undefined> {
    return await this.respondRepository
      .createQueryBuilder('respond')
      .leftJoinAndSelect('respond.tokens', 'token')
      .where('respond.status = -1')
      .andWhere('TIMESTAMPDIFF(DAY, respond.updated, NOW()) > :days', {
        days: 15,
      })
      .getOne();
  }

  async updateOneSettlement(
    id: number,
    paying: number,
    payable: number,
    note: string,
  ): Promise<any> {
    const respond = await this.respondRepository.findOne(id);
    if (!respond) {
      throw new NotFoundException();
    }

    const settlementDto = {
      paying: Number(paying),
      payable: Number(payable),
      dispute: '',
      note,
    };

    const partialEntity: any = {
      settlement: JSON.stringify(settlementDto),
      status: 0,
    };

    return this.respondRepository.update(id, partialEntity);
  }
}
