import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { QuestionnaireService } from './questionnaire.service';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
import { UpdateQuestionnaireDto } from './dto/update-questionnaire.dto';
import { JwtAuthGuard } from '@app/auth';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateUsingOpenAI } from './dto/create-using-openai.dto';
import { Questionnaire } from '@app/database';

@Controller('questionnaire')
export class QuestionnaireController {
  constructor(
    private readonly questionnaireService: QuestionnaireService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: any, @Body() dto: CreateQuestionnaireDto): Promise<Questionnaire> {
    return this.questionnaireService.create(dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req: any): Promise<Questionnaire[]> {
    return this.questionnaireService.findAll(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('many/:ids')
  findMany(@Param('ids') idsParam: string): Promise<Questionnaire[]> {
    const ids = idsParam.split(',');
    return this.questionnaireService.findMany(ids);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id',new ParseUUIDPipe()) id: string): Promise<Questionnaire> {
    return this.questionnaireService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id',new ParseUUIDPipe()) id: string,
    @Body() updateDto: UpdateQuestionnaireDto,
  ): Promise<Questionnaire> {
    return this.questionnaireService.update(id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/question')
  addQuestion(
    @Param('id',new ParseUUIDPipe()) id: string,
    @Body() questionDto: CreateQuestionDto,
  ): Promise<Questionnaire> {
    return this.questionnaireService.addQuestion(id, questionDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/questions')
  addQuestions(
    @Param('id',new ParseUUIDPipe()) id: string,
    @Body() questions: CreateQuestionDto[],
  ): Promise<Questionnaire> {
    return this.questionnaireService.addQuestions(id, questions);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id',new ParseUUIDPipe()) id: string): Promise<{ success: boolean; }> {
    return this.questionnaireService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("UsingAI")
  createQuestionnaireUsingAI(@Body() Body: CreateUsingOpenAI, @Req() req): Promise<Questionnaire> {
    console.log("questionnair using ai",Body);
    return this.questionnaireService.useOpenAI(req.user.id, Body.prompt, Body.title, Body.description);
  }
}
