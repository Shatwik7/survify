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

  
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: any, @Body() dto: CreateQuestionnaireDto): Promise<Questionnaire> {
    return this.questionnaireService.create(dto, req.user.id);
  }

  
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Req() req: {user:{id:string}}): Promise<Questionnaire[]> {
    return this.questionnaireService.findAll(req.user.id);
  }

  
  @Get('many/:ids')
  @UseGuards(JwtAuthGuard)
  findMany(@Param('ids') idsParam: string,@Req() req:{user:{id:string}}): Promise<Questionnaire[]> {
    const ids = idsParam.split(',');
    return this.questionnaireService.findMany(ids,req.user.id);
  }

  
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id',ParseUUIDPipe) id: string,@Req() req:{user:{id:string}},): Promise<Questionnaire> {
    return this.questionnaireService.findOne(id,req.user.id);
  }
 
  
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id',ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateQuestionnaireDto,
    @Req() req:{user:{id:string}},
  ): Promise<Questionnaire> {
    return this.questionnaireService.update(req.user.id,id, updateDto);
  }

  
  @Post(':id/question')
  @UseGuards(JwtAuthGuard)
  addQuestion(
    @Param('id',ParseUUIDPipe) id: string,
    @Body() questionDto: CreateQuestionDto,
    @Req() req:{user:{id:string}},
  ): Promise<Questionnaire> {
    return this.questionnaireService.addQuestion(req.user.id,id, questionDto);
  }

  @Patch(":questionnaireId/question/:questionId")
  @UseGuards(JwtAuthGuard)
  updateQuestion(
    @Param('questionId',ParseUUIDPipe) questionId: string,
    @Param('questionnaireId',ParseUUIDPipe) questionnaireId: string,
    @Req() req:{user:{id:string}},
    @Body() UpdateQuestionnaireDto:Partial<CreateQuestionDto>
  ){
    return this.questionnaireService.updateQuestions(req.user.id,questionnaireId,questionId,UpdateQuestionnaireDto);
  }

  @Delete(":questionnaireId/question/:questionId")
  @UseGuards(JwtAuthGuard)
  deleteQuestion(
    @Param('questionId',ParseUUIDPipe) questionId: string,
    @Param('questionnaireId',ParseUUIDPipe) questionnaireId: string,
    @Req() req:{user:{id:string}},
    
  ): Promise<Questionnaire | null>{
    return this.questionnaireService.removeQuestion(req.user.id,questionnaireId,questionId)
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/questions')
  addQuestions(
    @Param('id',new ParseUUIDPipe()) id: string,
    @Body() questions: CreateQuestionDto[],
    @Req() req:{user:{id:string}},
  ): Promise<Questionnaire> {
    return this.questionnaireService.addQuestions(req.user.id,id, questions);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id',new ParseUUIDPipe()) id: string,@Req() req:{user:{id:string}},): Promise<{ success: boolean; }> {
    return this.questionnaireService.remove(req.user.id,id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("UsingAI")
  createQuestionnaireUsingAI(@Body() Body: CreateUsingOpenAI, @Req() req): Promise<Questionnaire> {
    console.log("questionnair using ai",Body);
    return this.questionnaireService.useOpenAI(req.user.id, Body.prompt, Body.title, Body.description);
  }
}
