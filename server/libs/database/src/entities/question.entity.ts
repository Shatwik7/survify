import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index, RelationId, } from 'typeorm';
import { Questionnaire } from './questionnaire.entity';
import { User } from './user.entity';

export type QuestionType = 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'radio';

@Entity('question')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ nullable: true })
  videoUrl?: string;

  @Column({ type: 'enum', enum: ['text', 'number', 'date', 'select', 'checkbox', 'radio'] })
  type: QuestionType;

  @Column("text", { array: true, nullable: true })
  options?: string[];

  @ManyToOne(() => Questionnaire, questionnaire => questionnaire.questions, { onDelete: 'CASCADE' })
  questionnaire: Questionnaire;

  @RelationId((question: Question) => question.questionnaire)
  questionnaireId: string;

  @ManyToOne(() => User)
  createdBy: User;
}
