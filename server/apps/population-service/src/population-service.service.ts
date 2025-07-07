import { Person, PersonDBService, Population, PopulationDBService } from '@app/database';
import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UUID } from 'crypto';
import { filterPersons } from './utils/filter.util';
import { FilterGroup } from './dto/filter.types';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bull';
import { QueueSegmentDto } from './dto/queue-segment.dto';
import { QueueUploadDto } from './dto/queue-upload.dto';
import * as fs from 'fs';
import { FileStorageService } from '@app/file-storage';
@Injectable()
export class PopulationService {

  constructor(
    private readonly populationDBservice: PopulationDBService,
    private readonly PersonDBService: PersonDBService,
    private readonly FileStorageService: FileStorageService,
    @InjectQueue('population') private readonly Queue: Queue
  ) { }

  getHello(): string {
    return 'Hello World!';
  }


  async getPopulations(userId: string,page?:number,limit?:number): Promise<Population[]> {
    return this.populationDBservice.getPopulationsForUser(userId,page,limit);
  }

  async getPoplation(id: UUID, userId: string): Promise<Population> {
    const population = await this.populationDBservice.getPopulation(id);
    if (!population) throw new NotFoundException("Population Does Not Exists");
    if (population.userId  !== userId) throw new UnauthorizedException("Access Denied");
    return population;
  }

  async getPopulationWithPersons(
    populationId: UUID,
    userId: UUID,
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    population: Population;
    total: number;
    persons: Person[];
  }> {
    if (limit && limit > 1999) throw new BadRequestException("Limit Passed : exceeds 2000");
    const res = await this.populationDBservice.getPopulationWithPersons(populationId, page, limit);
    if (!res || res.population == null || !res.population) throw new NotFoundException("Population Not Found");
    const { population, persons, total } = res;
    if (population.userId  !== userId) throw new UnauthorizedException("Population Does Not Belongs to the User");
    return { population, total, persons };
  }

  async getAllPerson() {
    return this.PersonDBService.getall();
  }

  async createPopulation(userId: string, name: string, parentPopulation?: Population, jobId?: UUID, status: "completed" | "queued" | "working" | "failed" = "completed"): Promise<Population> {
    return this.populationDBservice.createPopulation(name, userId, parentPopulation, jobId, status);
  }


  async filterPopulation(userId: string, populationId: string, filter: FilterGroup, page: number, pageSize: number) {
    const population = await this.populationDBservice.getPopulationWithPersons(populationId, page, pageSize);
    if (!population) throw new NotFoundException("No Such Population");
    if (population.population.userId != userId) throw new UnauthorizedException("unauthorized exception for the user");
    const persons = filterPersons(population.persons, filter);
    return persons;
  }

  async uploadPopulationAsync(populationId: string, userId: string, filePath: string): Promise<Population> {
    try {
      const population = await this.populationDBservice.getPopulation(populationId);
      if (!population) throw new NotFoundException('Population Not Found');
      if (population.userId  != userId) throw new UnauthorizedException("Population Access Denied");
      if (["queued", "working"].includes(population.status)) throw new ConflictException("Current State Is :", population.status);
      const data = new QueueUploadDto();
      data.filePath = filePath;
      data.population = population;
      data.userId = userId;
      const jobId = crypto.randomUUID();
      const pop = await this.populationDBservice.updatePopulation(populationId, undefined, "queued", undefined, jobId);
      const job = await this.Queue.add('upload', data, {
        jobId: jobId,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 30000
        }
      });
      if (!pop) throw new NotFoundException()
      return pop;
    } catch (error) {
      this.FileStorageService.delete(filePath);
      await this.populationDBservice.updatePopulation(populationId, undefined, "failed");
      throw error;
    }

  }

  async createSegmentationAsync(segmentName: string, userId: string, parentPopulationId: string, filter: FilterGroup)
    : Promise<Population> {
    const job_Id = crypto.randomUUID();
    const pop = await this.populationDBservice.getPopulationWithPersons(parentPopulationId);
    if (!pop || !pop.population) throw new NotFoundException("Parent Population Does Not Exists");
    if (pop.population.userId  !== userId) throw new UnauthorizedException("Parent Population Access Denied");
    if (["queued", "working"].includes(pop.population.status)) throw new ConflictException("Current State Is :", pop.population.status);
    const toPopualtion = await this.populationDBservice.createPopulation(segmentName, userId, pop.population, job_Id, "queued");
    const data = new QueueSegmentDto();
    data.filter = filter;
    data.toPopulation = toPopualtion;
    data.fromPopulation = pop.population;
    data.total = pop.total;
    data.lastSuccessfulPage = 1;
    data.userId = userId;
    const job = await this.Queue.add('segmentation', data,
      {
        jobId: job_Id,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 30000
        },
      });
    return toPopualtion;
  }

  async createPersonAndAddToPopulation(person: { email: string, phone: string, name: string, customFields: Record<string, any> }, userId: string, populationId: string): Promise<Person> {
    const population = await this.populationDBservice.getPopulation(populationId);
    if (!population) throw new NotFoundException("Population Not Found");
    if (population.userId  != userId) throw new UnauthorizedException("Population Access Denied");
    return this.PersonDBService.addPersonToPopulation(person, populationId);
  }

  async deletePopulation(populationId: string, userId: string): Promise<boolean> {
    const population = await this.populationDBservice.getPopulation(populationId);
    if (!population) throw new NotFoundException("Population Not Found");
    if (population.userId  !== userId) throw new UnauthorizedException("Population Acces Denied");
    return this.populationDBservice.deletePopulation(populationId);
  }

  async updatePersonFromPopulation(populationId: string, userId: string, personId: string, person: Partial<Person>): Promise<boolean> {
    const population = await this.populationDBservice.getPopulation(populationId);
    console.log(population);
    if (!population) throw new NotFoundException("Population Not Found");
    if (population.userId  !== userId) throw new UnauthorizedException("Population Acces Denied");
    const result = await this.PersonDBService.updatePersonInPopulation(personId, person );
    return result;
  }


  async deletePersonFromPopulation(populationId: string, userId: string, personId: string): Promise<void> {
    const population = await this.populationDBservice.getPopulation(populationId);
    if (!population) throw new NotFoundException("Population Not Found");
    if (population.userId !== userId) throw new UnauthorizedException("Population Acces Denied");
    const result = await this.PersonDBService.removePersonPopulationRelation(personId, populationId);
    return result;
  }

}
