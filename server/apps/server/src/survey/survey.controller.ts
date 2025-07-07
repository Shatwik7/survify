import { Body, Controller, Get, Param, ParseIntPipe, ParseUUIDPipe, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { SurveyService } from './survey.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { SubmitAnswersDto } from './dto/submit-answers.dto';
import { JwtAuthGuard } from '@app/auth';
import { Answer, Survey } from '@app/database';
import { Response } from 'express';
import { SurveyWithQuestionsDto } from './dto/survey-with-questions.dto';
import { UUID } from 'crypto';

@Controller('survey')
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}
  @Get()
  @UseGuards(JwtAuthGuard)
  async getSurvey(@Req() req:{user:{id:string}}){
    console.log("USER:",req.user.id)
    return this.surveyService.get(req.user.id);
  }
  @Post()
  @UseGuards(JwtAuthGuard)
  async createSurvey(
    @Body() createSurveyDto: CreateSurveyDto,
    @Req() req: { user: { id: string } }
  ): Promise<Survey> {
    return this.surveyService.createSurvey(createSurveyDto,req.user.id);
  }

  @Post(':id/send')
  @UseGuards(JwtAuthGuard)
  async sendSurveyLinks(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: { id: string } }
  ) : Promise<{
    sendJobStatus: 'Queued';
    sendJobId: UUID;
    sendProgress: number;
    sendJobStartedAt: number;
    sendJobCompletedAt?: number;
}> {
    return this.surveyService.sendSurveyLinks(id);
  }

  @Get('questions/:jwt')
  async getSurveyWithQuestions(@Param('jwt') jwt: string): Promise<SurveyWithQuestionsDto> {
    return this.surveyService.getSurveyWithQuestions(jwt);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getSurveyById(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: { id: string } }
  ): Promise<Survey> {
    return this.surveyService.getSurveyById(id);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard)
  async getSurveyStats(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: { id: string } }
  ): Promise<{
    total: number;
    seen: number;
    completed: number;
}>{
    return this.surveyService.getSurveyStats(id);
  }

  @Get(':id/job-status')
  @UseGuards(JwtAuthGuard)
  async getSurveyJobStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: { id: string } }
  ): Promise<{
    sendJobStatus: 'NotStarted' | 'Queued' | 'Processing' | 'Completed' | 'Failed';
    sendJobId?: string;
    sendProgress: number;
    sendJobStartedAt?: Date;
    sendJobCompletedAt?: Date;
  }>{
    return this.surveyService.getSurveyJobStatus(id);
  }

  @Post('submit')
  async submitAnswers(@Body() submitAnswersDto: SubmitAnswersDto): Promise<void> {
    console.log(submitAnswersDto);
    return this.surveyService.submitAnswers(submitAnswersDto.jwt, submitAnswersDto.answers);
  }

  @Get(":id/answers")
  @UseGuards(JwtAuthGuard)
  async getAnswers(
    @Req() req:{user:{id:string}}, 
    @Param("id",ParseUUIDPipe) surveyId:string,
    @Query('page',new ParseIntPipe({optional:true})) page:number,
    @Query('limit',new ParseIntPipe({optional:true})) limit:number
  ): Promise<Answer[]>{
    return this.surveyService.getAnswer(req.user.id,surveyId,page,limit);
  }

  @Get(":id/answers/export")
  async exportAnswers(
    @Res() res: Response,
    @Param("id", ParseUUIDPipe) surveyId: string,
  ) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="survey_${surveyId}_answers.csv"`,
    );
    
    const { stream, release } = await this.surveyService.getAnswersStream(surveyId);
    try {
      res.write('Answer ID,Answer,Answered At,Person Email,Question,Question Type\n');
      const actualStream = await stream; 
      for await (const row of actualStream) {
        const csvLine = [
          row.answer_id,
          Array.isArray(row.answer) ? row.answer.join(';') : row.answer,
          row.answered_at,
          row.person_email,
          `"${row.question.replace(/"/g, '""')}"`,
          row.question_type
        ].join(',') + '\n';
        
        res.write(csvLine);
      }
      res.end();
    } finally {
      release();
    }
  }
  // @Get(":id/answers/stream")
  // @UseGuards(JwtAuthGuard)
  // async getAnswersStream(
  //   @Param("id", ParseUUIDPipe) surveyId: string,
  // ) {
  //   return this.surveyService.getAnswersStream(surveyId);
  // }
} 