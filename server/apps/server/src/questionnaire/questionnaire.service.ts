import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Questionnaire, QuestionnaireDBService } from '@app/database';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
import { UpdateQuestionnaireDto } from './dto/update-questionnaire.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';

@Injectable()
export class QuestionnaireService {
  constructor(
    private readonly questionnaireRepo: QuestionnaireDBService,
    @InjectQueue('openai-questionnare-generator') private readonly AIQueue: Queue,
  ) { }

  async create(
    createQuestionnaireDto: CreateQuestionnaireDto,
    userId: string,
  ): Promise<Questionnaire> {
    return this.questionnaireRepo.addQuestionnaire(
      createQuestionnaireDto.title,
      createQuestionnaireDto.description,
      'draft',
      userId,
    );
  }

  async findAll(userId: string): Promise<Questionnaire[]> {
    return this.questionnaireRepo.findAll(userId);
  }

  async findOne(id: string): Promise<Questionnaire> {
    const questionnaire = await this.questionnaireRepo.findById(id);
    if (!questionnaire) {
      throw new NotFoundException(`Questionnaire with ID ${id} not found`);
    }
    return questionnaire;
  }

  async findMany(ids: string[]): Promise<Questionnaire[]> {
    const results = await this.questionnaireRepo.findByIds(ids);
    if (!results || results.length === 0) {
      throw new NotFoundException(`No questionnaires found for given IDs`);
    }
    return results;
  }

  async addQuestion(
    questionnaireId: string,
    questionDto: CreateQuestionDto,
  ): Promise<Questionnaire> {
    const updated = await this.questionnaireRepo.addQuestionToQuestionnaire(
      questionnaireId,
      questionDto,
    );
    if (!updated) {
      throw new BadRequestException(
        `Failed to add question to questionnaire with ID ${questionnaireId}`,
      );
    }
    return updated;
  }

  async addQuestions(
    questionnaireId: string,
    questions: CreateQuestionDto[],
  ): Promise<Questionnaire> {
    const updated =
      await this.questionnaireRepo.addMultipleQuestionsToQuestionnaire(
        questionnaireId,
        questions,
      );
    if (!updated) {
      throw new BadRequestException(
        `Failed to add questions to questionnaire with ID ${questionnaireId}`,
      );
    }
    return updated;
  }

  async update(
    id: string,
    updateQuestionnaireDto: UpdateQuestionnaireDto,
  ): Promise<Questionnaire> {
    const updated = await this.questionnaireRepo.update(
      id,
      updateQuestionnaireDto,
    );
    if (!updated) {
      throw new NotFoundException(`Questionnaire with ID ${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const success = await this.questionnaireRepo.delete(id);
    if (!success) {
      throw new NotFoundException(`Questionnaire with ID ${id} not found`);
    }
    return { success: success }
  }

  async useOpenAI(userId:string,prompt:string,title:string,description:string):Promise<Questionnaire>{
    const questionnaire=await this.questionnaireRepo.addQuestionnaire(title,description,"queued",userId,prompt);
    const job=await this.AIQueue.add('genrate',{
      prompt:prompt,
      id:questionnaire.id
    });
    return questionnaire;
  }

  async changeStatusToCompleted(id:string):Promise<Questionnaire|null>{
    const questionnaire=await this.questionnaireRepo.update(id,{status:"completed"});
    return questionnaire;
  }
}
