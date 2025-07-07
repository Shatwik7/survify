import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Population } from './population.entity';

@Entity('person')
export class Person {
  @Index()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  email: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column('jsonb', { default: {} })
  customFields?: Record<string, any>;

  @ManyToMany(() => Population, (p) => p.persons)
  populations: Population[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
