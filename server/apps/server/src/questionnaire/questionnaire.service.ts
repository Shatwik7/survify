import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { QuestionDBService, Questionnaire, QuestionnaireDBService } from '@app/database';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
import { UpdateQuestionnaireDto } from './dto/update-questionnaire.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';

@Injectable()
export class QuestionnaireService {
  constructor(
    private readonly questionnaireRepo: QuestionnaireDBService,
    private readonly questionRepo:QuestionDBService,
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

  async findOne(id: string,userId:string): Promise<Questionnaire> {
    const questionnaire = await this.questionnaireRepo.findById(id);
    if(!questionnaire) throw new NotFoundException('No such Questionnaire');
    if(questionnaire.userId!=userId) throw new UnauthorizedException('Access Denied');
    return questionnaire;
  }

  async findMany(ids: string[],userId:string): Promise<Questionnaire[]> {
    const results = await this.questionnaireRepo.findByIds(ids);
    if (!results || results.length === 0) {
      throw new NotFoundException(`No questionnaires found for given IDs`);
    }
    let r=results.filter((e)=>e.userId==userId)
    return r;
  }

  async addQuestion(
    userId:string,
    questionnaireId: string,
    questionDto: CreateQuestionDto,
  ): Promise<Questionnaire> {
    const questionnaire=await this.questionnaireRepo.findById(questionnaireId);
    if(!questionnaire) throw new NotFoundException('No such Questionnaire');
    if(questionnaire.userId!=userId) throw new UnauthorizedException('Access Denied');
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
    userId:string,
    questionnaireId: string,
    questions: CreateQuestionDto[],
  ): Promise<Questionnaire> {
    const questionnaire=await this.questionnaireRepo.findById(questionnaireId);
    if(!questionnaire) throw new NotFoundException('No such Questionnaire');
    if(questionnaire.userId!=userId) throw new UnauthorizedException('Access Denied');
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

  async updateQuestions(
    userId:string,
    questionnaireId:string,
    questionId:string,
    UpdateQuestionnaireDto:Partial<CreateQuestionDto>
  ): Promise<Questionnaire | null>{
    const question=await this.questionRepo.findById(questionId);
    if(!question) throw new NotFoundException("No Such Question");
    if(question.questionnaireId!==questionnaireId) throw new UnauthorizedException("Access Denied");
    return this.questionnaireRepo.updateQuestionInQuestionnaire(questionnaireId,questionId,UpdateQuestionnaireDto);
    
  }

  async removeQuestion( 
    userId:string,
    questionnaireId:string,
    questionId:string,
  ): Promise<Questionnaire | null>{
    const question=await this.questionRepo.findById(questionId);
    if(!question) throw new NotFoundException("No Such Question");
    if(question.questionnaireId!==questionnaireId) throw new UnauthorizedException("Access Denied");
    return this.questionnaireRepo.removeQuestionFromQuestionnaire(questionnaireId,questionId);
  }

  async update(
    userId:string,
    questionnaireId: string,
    updateQuestionnaireDto: UpdateQuestionnaireDto,
  ): Promise<Questionnaire> {
    const questionnaire=await this.questionnaireRepo.findById(questionnaireId);
    if(!questionnaire) throw new NotFoundException('No such Questionnaire');
    if(questionnaire.userId!=userId) throw new UnauthorizedException('Access Denied');
    const updated = await this.questionnaireRepo.update(
      questionnaireId,
      updateQuestionnaireDto,
    );
    if (!updated) {
      throw new BadRequestException(
        `Failed to add question to questionnaire with ID ${questionnaireId}`,
      );
    }
    return updated;
  }

  async remove(userId:string,questionnaireId: string): Promise<{ success: boolean }> {
    const questionnaire=await this.questionnaireRepo.findById(questionnaireId);
    if(!questionnaire) throw new NotFoundException('No such Questionnaire');
    if(questionnaire.userId!=userId) throw new UnauthorizedException('Access Denied');
    const success = await this.questionnaireRepo.delete(questionnaireId);
    if (!success) {
      throw new BadRequestException(
        `Failed to add question to questionnaire with ID ${questionnaireId}`,
      );
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
