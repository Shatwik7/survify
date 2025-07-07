import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, RelationId } from "typeorm";
import { Survey } from "./survey.entity";
import { Person } from "./person.entity";
import { Question } from "./question.entity";

@Entity('answer')
export class Answer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Survey, { onDelete: 'CASCADE', })
    survey: Survey;

    @RelationId((answer: Answer) => answer.survey)
    surveyId: string;

    @ManyToOne(() => Person, { onDelete: 'CASCADE' })
    person: Person;

    @RelationId((answer: Answer) => answer.person)
    personId: string;

    @ManyToOne(() => Question, { onDelete: 'CASCADE' })
    question: Question;

    @RelationId((answer: Answer) => answer.question)
    questionId: string;
    
    @Column('text', { array: true, nullable: true })
    value: string[];

    @CreateDateColumn()
    createdAt: Date;
}