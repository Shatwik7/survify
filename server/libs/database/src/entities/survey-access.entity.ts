import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, RelationId, UpdateDateColumn, Index } from "typeorm";
import { Survey } from "./survey.entity";
import { Person } from "./person.entity";

@Entity('survey_access')
export class SurveyAccess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Survey, { onDelete: 'CASCADE' })
  survey: Survey;

  @RelationId((access: SurveyAccess) => access.survey)
  surveyId: string;

  @ManyToOne(() => Person, { onDelete: 'CASCADE' })
  person: Person;

  @RelationId((access: SurveyAccess) => access.person)
  personId: string;

  @Index()
  @Column({ unique: true })
  jwtToken: string;

  @Column({ default: false })
  seen: boolean;

  @Column({ nullable: true })
  seenAt?: Date;

  @Column({ default: false })
  completed: boolean;

  @Column({ nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 