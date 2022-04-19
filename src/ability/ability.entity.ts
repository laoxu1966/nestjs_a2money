import {
  Entity,
  Column,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Transform, Expose } from 'class-transformer';

import { Respond } from '../respond/respond.entity';

@Entity({ engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci' })
@Index(['title', 'des'], { fulltext: true, parser: 'ngram' })
@Index(['title'], { fulltext: true, parser: 'ngram' })
@Index(['des'], { fulltext: true, parser: 'ngram' })
@Index(['status', 'paying', 'classification'])
@Index(['status', 'classification', 'tag'])
@Index(['status', 'uid'])
@Index(['uid'])
export class Ability {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  paying: number;

  @Column()
  classification: number;

  @Column({ charset: 'utf8mb4' })
  tag: string;

  @Column({ charset: 'utf8mb4' })
  title: string;

  @Column({ length: 510, charset: 'utf8mb4' })
  des: string;

  @Column({ length: 255, charset: 'utf8mb4' })
  risk: string;

  @Column()
  respondDate: string;

  @Column()
  respondTime: string;

  @Column()
  @Transform((files) => JSON.parse(files.value ?? '[]'))
  files: string;

  @Column({ default: '' })
  email: string;

  @Column({ default: '' })
  tel: string;

  @Column({ default: '' })
  geo: string;

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

  @OneToMany(() => Respond, (respond) => respond.ability)
  responds: Respond[];

  @Expose()
  get avatar(): string {
    const obj = JSON.parse(this.profile ?? '{}');
    return obj.avatar;
  }

  @Expose()
  get displayName(): string {
    const obj = JSON.parse(this.profile ?? '{}');
    return obj.displayName;
  }

  @Expose()
  get description(): string {
    const obj = JSON.parse(this.profile ?? '{}');
    return obj.description;
  }
}

@Entity({ engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci' })
@Index(['status', 'weight'])
@Index(['status', 'created'])
export class Hot {
  @PrimaryColumn()
  hot: string;

  @Column({ default: 1 })
  weight: number;

  @Column({ default: 0 })
  status: number;

  @CreateDateColumn()
  created: Date;
}

@Entity({ engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci' })
@Index(['classification', 'tag', 'weight'])
@Index(['created'])
export class Tag {
  @PrimaryColumn()
  classification: number;

  @PrimaryColumn({ charset: 'utf8mb4' })
  tag: string;

  @Column({ default: 1 })
  weight: number;

  @CreateDateColumn()
  created: Date;
}
