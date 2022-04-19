import {
  Entity,
  Index,
  Unique,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Transform } from 'class-transformer';

import { Ability } from '../ability/ability.entity';
import { Token } from '../token/token.entity';

@Entity({ engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci' })
@Unique(['abilityid', 'uid'])
@Index(['uid'])
@Index(['abilityuid'])
@Index(['status', 'updated'])
export class Respond {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  abilityid: number;

  @Column()
  abilityuid: number;

  @Column({ default: '{}', length: 1020, charset: 'utf8mb4' })
  contractA: string;

  @Column({ default: '{}', length: 1020, charset: 'utf8mb4' })
  contractB: string;

  @Column({ default: '{}', length: 1020, charset: 'utf8mb4' })
  @Transform((contract) => JSON.parse(contract.value ?? '{}'))
  contract: string;

  @Column({ default: '{}', length: 510, charset: 'utf8mb4' })
  @Transform((settlementA) => JSON.parse(settlementA.value ?? '{}'))
  settlementA: string;

  @Column({ default: '{}', length: 510, charset: 'utf8mb4' })
  @Transform((settlementB) => JSON.parse(settlementB.value ?? '{}'))
  settlementB: string;

  @Column({ default: '{}', length: 510, charset: 'utf8mb4' })
  settlement: string;

  @Column({ default: '', charset: 'utf8mb4' })
  memo: string;

  @Column({ default: 0 })
  status: number;

  @Column()
  uid: number;

  @Column({ charset: 'utf8mb4' })
  profile: string;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @ManyToOne(() => Ability, (ability) => ability.responds)
  @JoinColumn({ name: 'abilityid' })
  ability: Ability;

  @OneToMany(() => Token, (token) => token.respond)
  tokens: Token[];
}
