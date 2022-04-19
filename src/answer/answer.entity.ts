import {
  Entity,
  Index,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Question } from '../question/question.entity';

@Entity({ engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci' })
@Index(['questionid'])
@Index(['uid'])
export class Answer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  questionid: number;

  @Column()
  questionuid: number;

  @Column({ length: 1020, charset: 'utf8mb4' })
  des: string;

  @Column({ default: 0 })
  win: number;

  @Column()
  uid: number;

  @Column({ charset: 'utf8mb4' })
  profile: string;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @ManyToOne(() => Question, (question) => question.answers)
  @JoinColumn({ name: 'questionid' })
  question: Question;
}
