import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, Index, RelationId } from 'typeorm';
import { User } from './user.entity';
import { Question } from './question.entity';

export type QuestionnaireStatus = 'draft' | 'queued' | 'completed' | 'failed';

@Entity('questionnaire')
export class Questionnaire {
  @Index()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ type: 'enum', enum: ['draft', 'queued', 'completed', 'failed'], default: 'draft' })
  status: QuestionnaireStatus;

  @Index()
  @ManyToOne(() => User, (u) => u.questionnaires, { onDelete: 'CASCADE' })
  user: User;

  @RelationId((questionnaire:Questionnaire)=>questionnaire.user)
  userId:string;

  @OneToMany(() => Question, (question) => question.questionnaire, { cascade: true })
  questions: Question[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({nullable:true})
  prompt?: string;
}
