import { BadRequestException, Body, ConflictException, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, ParseIntPipe, ParseUUIDPipe, Post, Put, Query, Req, UnauthorizedException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { PopulationService } from './population.service';
import { JwtAuthGuard } from '@app/auth';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { UUID } from 'crypto';
import { FilterGroup } from './dto/filter.types';
import { Person, Population } from '@app/database';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { addPersonDto } from './dto/add-person.dto';
import { FileStorageService } from '@app/file-storage';
import { UpdatePersonDto } from './dto/update-person.dto';

@Controller('population')
export class PopulationController {

  constructor(
    private readonly populationService: PopulationService,
    private readonly FileStorageService:FileStorageService,
    @InjectQueue('population') private readonly Queue: Queue,
  ) { }


  @Get()
  @UseGuards(JwtAuthGuard)
  getPopulations(
    @Req() req: { user: { id: UUID } }, 
    @Query('page',new ParseIntPipe({"optional":true})) page,
    @Query('limit',new ParseIntPipe({"optional":true})) limit
  ): Promise<Population[]> {
    return this.populationService.getPopulations(req.user.id,page,limit);
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  getPopulation(
    @Param("id", new ParseUUIDPipe()) id: UUID,
    @Req() req: { user: { id: UUID }}
  ): Promise<Population> {
    return this.populationService.getPoplation(id,req.user.id);
  }

  @Get('/:id/person')
  @UseGuards(JwtAuthGuard)
  getPopulationWithPerson(
    @Param("id", new ParseUUIDPipe()) id: UUID,
    @Query("page",new ParseIntPipe({"optional":true})) page: number=1,
    @Query("limit",new ParseIntPipe({"optional":true})) limit: number=50,
    @Req() req: { user: { id: UUID }
  }): Promise<{
    population: Population;
    total: number;
    persons: Person[];
  }> {
    return this.populationService.getPopulationWithPersons(id, req.user.id,page,limit);
  }

  @Get('removeJob/:jobId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async removeJob(@Param('jobId') jobId: string, @Req() req:{user:{id:string}}): Promise<number>{
    const job=await this.Queue.getJob(jobId);
    if (!job) throw new NotFoundException("No Such Job Exists");
    if (job.data.userId!=req.user.id) throw new UnauthorizedException("Job Access Denied");
    if(job.getStatus()=="active") throw new ConflictException("JOB IS WORKING | IT CAN NOT BE REMOVED");
    return this.Queue.remove(jobId);
  }

  @Get('getJobStatus/:jobId') // status for all jobs related to population use the progress for notification.
  @UseGuards(JwtAuthGuard)
  async getStatus(@Param('jobId') jobId: string, @Req() req:{user:{id:string}}) {
    const job = await this.Queue.getJob(jobId);
    if (!job) throw new NotFoundException("No Such Job Exists");
    if (job.data.userId!=req.user.id) throw new UnauthorizedException("Job Access Denied");
    return job; // ==>"job.progress: number % -->regularly updates"
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async createPopulation(
    @Body() body: { name: string },
    @Req() req: { user: { id: string } 
  }): Promise<Population> {
    const { name } = body;
    const userId = req.user.id;
    if (!name || !userId) {
      throw new BadRequestException('Missing required fields');
    }
    const population = await this.populationService.createPopulation(userId, name, undefined, undefined, "completed");
    return population;
  }

  // create new segments 
  // create a new population with the filtered data
  @Post('createsegmentaion')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  createSegmentationAsync(
    @Body() body: CreateSegmentDto, 
    @Req() req: { user: { id: string } 
  }): Promise<Population> {
    const { parentPopulationId, segmentName, filter } = body;
    const userId = req.user.id;
    const data = this.populationService.createSegmentationAsync(segmentName, userId, parentPopulationId, filter);
    return data;
  }


  @Delete("/:populationId")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deletePopualtion(
    @Param("populationId",new ParseUUIDPipe()) populationId,
    @Req() req:{user:{id:string}}
  ):Promise<Boolean>{
    return this.populationService.deletePopulation(populationId,req.user.id);
  }

  @Delete("/:populationId/person/:personId")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deletePersonFromPopulation(
    @Param("populationId",new ParseUUIDPipe()) populationId,
    @Param("personId",new ParseUUIDPipe()) personId,
    @Req() req:{user:{id:string}}
  ): Promise<void>{
    return this.populationService.deletePersonFromPopulation(populationId,req.user.id,personId);
  }

  @Put("/:populationId/person/:personId")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async UpdatePerson(
    @Param("populationId",new ParseUUIDPipe()) populationId,
    @Param("personId",new ParseUUIDPipe()) personId,
    @Body() person: UpdatePersonDto,
    @Req() req:{user:{id:string}}
  ): Promise<boolean>{
    return this.populationService.updatePersonFromPopulation(populationId, req.user.id, personId, person);
  }


  @Post('/:populationId/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async createPopulationAsync(
    @UploadedFile() file: Express.Multer.File,  // heading in this order --> email, phone, name,	...customfields/otherfields(can inscrease or decrease)
    @Param("populationId", new ParseUUIDPipe()) populationId,
    @Req() req: { user: { id: string } },
  ):Promise<Population> {
    const filePath=await this.FileStorageService.upload(file);
    const pop = this.populationService.uploadPopulationAsync(populationId, req.user.id, filePath);
    return pop;
  }

  //for showing the filters work 
  @Post('/:populationId/segment') // shows the segmented data "some not all"
  @UseGuards(JwtAuthGuard)
  filterAndGet(
    @Body() filters: FilterGroup,
    @Req() req: { user: { id: string } },
    @Param("populationId") populationId,
    @Query("page") page: number,
    @Query("limit") limit: number
  ): Promise<Person[]> {
    const persons = this.populationService.filterPopulation(req.user.id, populationId, filters, page, limit);
    return persons;
  }


  @Post('/:populationId/addPerson')
  @UseGuards(JwtAuthGuard)
  addPerson(
    @Body() person: addPersonDto,
    @Req() req: { user: { id: string } },
    @Param('populationId') populationId: string
  ) {
    return this.populationService.createPersonAndAddToPopulation(person, req.user.id, populationId);
  }

}
