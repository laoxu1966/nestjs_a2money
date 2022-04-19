import {
  Entity,
  Column,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Transform, Expose } from 'class-transformer';

import { Answer } from '../answer/answer.entity';

@Entity({ engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci' })
@Index(['title', 'des'], { fulltext: true, parser: 'ngram' })
@Index(['title'], { fulltext: true, parser: 'ngram' })
@Index(['des'], { fulltext: true, parser: 'ngram' })
@Index(['status', 'classification', 'tag'])
@Index(['status', 'uid'])
@Index(['uid'])
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  classification: number;

  @Column({ charset: 'utf8mb4' })
  tag: string;

  @Column({ charset: 'utf8mb4' })
  title: string;

  @Column({ length: 510, charset: 'utf8mb4' })
  des: string;

  @Column()
  @Transform((files) => JSON.parse(files.value ?? '[]'))
  files: string;

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

  @OneToMany(() => Answer, (answer) => answer.question)
  answers: Answer[];

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
