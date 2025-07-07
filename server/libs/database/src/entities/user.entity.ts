import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { Questionnaire } from './questionnaire.entity';
import { Population } from './population.entity';

@Entity('user')
export class User {
  @Index()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  password: string; // hashed

  @OneToMany(() => Questionnaire, (q) => q.user)
  questionnaires: Questionnaire[];

  @OneToMany(()=> Population,(q) => q.user)
  populations: Population[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
