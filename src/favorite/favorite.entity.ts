import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci' })
@Unique(['code', 'peer', 'uid'])
export class Favorite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  code: number;

  @Column()
  peer: number;

  @Column({ default: '' })
  memo: string;

  @Column({ charset: 'utf8mb4' })
  profile: string;

  @Column()
  uid: number;
}
