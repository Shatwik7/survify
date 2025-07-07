import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Questionnaire } from "../entities/questionnaire.entity";
import { Question } from "../entities/question.entity";
import { User } from "../entities/user.entity";

@Injectable()
export class QuestionnaireDBService {
  constructor(
    @InjectRepository(Questionnaire)
    private questionnaireRepo: Repository<Questionnaire>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Question)
    private questionRepo: Repository<Question>
  ) {}

  async findById(id: string): Promise<Questionnaire | null> {
    return this.questionnaireRepo.findOne({
      where: { id },
      relations: ['questions', 'user'],
    });
  }

  async findAll(userId: string): Promise<Questionnaire[]> {
    return this.questionnaireRepo.find({
      where: { user: { id: userId } },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        status: true,
      },
    });
  }

  async addQuestionnaire(
    title: string,
    description: string,
    status: 'draft' | 'queued' | 'completed' | 'failed',
    userId: string,
    prompt?:string
  ): Promise<Questionnaire> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const newQuestionnaire = this.questionnaireRepo.create({
      title,
      description,
      status,
      user,
      prompt
    });

    return this.questionnaireRepo.save(newQuestionnaire);
  }

  async update(id: string, updateData: Partial<Questionnaire>): Promise<Questionnaire | null> {
    const questionnaire = await this.questionnaireRepo.findOne({ where: { id } });
    if (!questionnaire) return null;

    Object.assign(questionnaire, updateData);
    return this.questionnaireRepo.save(questionnaire);
  }

  async create(
    title: string,
    description: string,
    status: 'draft' | 'queued' | 'completed' | 'failed',
    questions: Question[]
  ): Promise<Questionnaire> {
    const newQuestionnaire = this.questionnaireRepo.create({
      title,
      description,
      status,
      questions,
    });

    return this.questionnaireRepo.save(newQuestionnaire);
  }

  async addQuestionToQuestionnaire(
    questionnaireId: string,
    questionData: {
      description: string;
      imageUrl?: string;
      videoUrl?: string;
      type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'radio';
      options?: string[];
    }
  ): Promise<Questionnaire | null> {
    const questionnaire = await this.questionnaireRepo.findOne({
      where: { id: questionnaireId },
      relations: ['questions'],
    });
    if (!questionnaire) return null;

    const question = this.questionRepo.create({
      ...questionData,
      questionnaire,
    });

    await this.questionRepo.save(question);
    return this.findById(questionnaireId);
  }

  async updateQuestionInQuestionnaire(
    questionnaireId: string,
    questionId: string,
    updatedData: Partial<Question>
  ): Promise<Questionnaire | null> {
    const question = await this.questionRepo.findOne({
      where: { id: questionId, questionnaire: { id: questionnaireId } },
    });
    if (!question) return null;

    Object.assign(question, updatedData);
    await this.questionRepo.save(question);
    return this.findById(questionnaireId);
  }

  async addMultipleQuestionsToQuestionnaire(
    questionnaireId: string,
    questionsData: {
      description: string;
      imageUrl?: string;
      videoUrl?: string;
      type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'radio';
      options?: string[];
    }[]
  ): Promise<Questionnaire | null> {
    const questionnaire = await this.questionnaireRepo.findOne({
      where: { id: questionnaireId },
    });
    if (!questionnaire) return null;

    const questions = this.questionRepo.create(
      questionsData.map((q) => ({ ...q, questionnaire }))
    );
    await this.questionRepo.save(questions);
    return this.findById(questionnaireId);
  }

  async removeQuestionFromQuestionnaire(questionnaireId: string, questionId: string): Promise<Questionnaire | null> {
    const question = await this.questionRepo.findOne({
      where: { id: questionId, questionnaire: { id: questionnaireId } },
    });
    if (!question) return null;

    await this.questionRepo.remove(question);
    return this.findById(questionnaireId);
  }

  async delete(questionnaireId: string): Promise<boolean> {
    const result = await this.questionnaireRepo.delete(questionnaireId);
    return result.affected! > 0;
  }

  async findByIds(ids: string[]): Promise<Questionnaire[]> {
    return this.questionnaireRepo.find({
      where: { id: In(ids) },
    });
  }
}
