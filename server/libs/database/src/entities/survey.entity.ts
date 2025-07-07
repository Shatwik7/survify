import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, RelationId, UpdateDateColumn } from "typeorm";
import { Questionnaire } from "./questionnaire.entity";
import { Population } from "./population.entity";
import { User } from "./user.entity";

@Entity('survey')
export class Survey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Questionnaire, { onDelete: 'CASCADE' })
  questionnaire: Questionnaire;

  @RelationId((survey: Survey) => survey.questionnaire)
  questionnaireId: string;

  @ManyToOne(() => Population, { onDelete: 'CASCADE' })
  population: Population;

  @RelationId((survey: Survey ) => survey.population)
  populationId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @RelationId((survey: Survey ) => survey.user)
  userId: string;

  @Column('simple-array')
  deliveryModes: ('email' | 'whatsapp')[];

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: false })
  analyzed: boolean;

  @Column({ 
    type: 'enum', 
    enum: ['NotStarted', 'Queued', 'Processing', 'Completed', 'Failed'], 
    default: 'NotStarted' 
  })
  sendJobStatus: 'NotStarted' | 'Queued' | 'Processing' | 'Completed' | 'Failed';

  @Column({ nullable: true })
  sendJobId?: string;

  @Column({ type: 'int', default: 0 })
  sendProgress: number;

  @Column({ type: 'timestamp', nullable: true })
  sendJobStartedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  sendJobCompletedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
