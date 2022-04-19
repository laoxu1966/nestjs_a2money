import {
  Entity,
  Column,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Respond } from '../respond/respond.entity';

@Entity()
@Index(['uid'])
@Index(['respondid'])
@Index(['out_request_no'])
export class Token {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  abilityid: number;

  @Column()
  respondid: number;

  @Column()
  peerid: string;

  @Column({ type: 'double' })
  payable: number;

  @Column({ type: 'double', default: 0.0 })
  freeze: number;

  @Column({ type: 'double', default: 0.0 })
  unfreeze: number;

  @Column({ type: 'double', default: 0.0 })
  pay: number;

  @Column({ type: 'double', default: 0.0 })
  income: number;

  @Column({ type: 'double', default: 0.0 })
  fee: number;

  @Column({ type: 'double', default: 0.0 })
  cash: number;

  @Column({ default: '' })
  out_request_no: string;

  @Column({ default: '{}', length: 1020, charset: 'utf8mb4' })
  msg: string;

  @Column()
  uid: number;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @ManyToOne(() => Respond, (respond) => respond.tokens)
  @JoinColumn({ name: 'respondid' })
  respond: Respond;
}
