import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Population } from '../entities/population.entity';
import { Person } from '../entities/person.entity';
import { UUID } from 'crypto';

@Injectable()
export class PopulationDBService {
  constructor(
    @InjectRepository(Population) private populationRepo: Repository<Population>,
    @InjectRepository(Person) private personRepo: Repository<Person>,
  ) { }

  async createPopulation(name: string, userId: string, parentPopulation?: Population, jobId?: UUID, status:"completed" | "queued" | "working" | "failed"="completed"): Promise<Population> {
    const population = this.populationRepo.create({ name, user: { id: userId }, status, parentPopulation, jobId });
    return this.populationRepo.save(population);
  }


  async updatePopulationStatus(id: string, status: "queued" | "completed" | "working" | "failed"): Promise<Population | null> {
    const population = await this.populationRepo.findOne({ where: { id } });
    if (!population) {
      return null;
    }
    population.status = status;
    return this.populationRepo.save(population);
  }

  async updatePopulation(id: string, name?:string,status?:"queued" | "completed" | "working" | "failed", children?:Population, jobId?:string ): Promise<Population | null> {
    const population = await this.populationRepo.findOne({ where: { id } , relations: ['children'] });
    if (!population) {
      return null;
    }
    if (name) population.name = name;
    if (status) population.status = status;
    if (children) population.children.push(children); 
    if(jobId) population.jobId= jobId;
    return this.populationRepo.save(population);
  }

  async deletePopulation(id: string): Promise<boolean> {
    const result = await this.populationRepo.delete(id);
    return !!result.affected && result.affected > 0;
  }

  async getPopulationsForUser(userId: string,page:number=1,pageSize:number=100): Promise<Population[]> {
    const population = await this.populationRepo.find({
      where: { user: { id: userId } },
      skip:(page-1)*pageSize,
      take:pageSize,
    })
    return population;
  }

  async getPopulation(id: string): Promise<Population | null> {
    const population = await this.populationRepo.findOne({
      where: { id }
    })
    return population;
  }

  async getPopulationWithPersons(
    id: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ population: Population; persons: Person[]; total: number } | null> {
    // Check limit before querying
    if (limit > 2000) {
      return null;
    }

    const population = await this.populationRepo.findOne({
      where: { id}
      , relations: ['user']
    });
    
    if (!population) {
      return null;
    }

    const [persons, total] = await this.personRepo
      .createQueryBuilder('person')
      .innerJoin('person.populations', 'population', 'population.id = :id', { id })
      .orderBy('person.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      population,
      persons,
      total,
    };
  }

  async filterAndCreateSegment(parentPopulationId: string, filters: Record<string, any>, segmentName: string): Promise<Population | null> {
    const parent = await this.populationRepo.findOne({
      where: { id: parentPopulationId },
    });

    if (!parent) {
      return null;
    }

    const qb = this.personRepo.createQueryBuilder('person');
    qb.innerJoin('person.populations', 'population', 'population.id = :populationId', {
      populationId: parentPopulationId,
    });

    for (const [key, value] of Object.entries(filters)) {
      qb.andWhere(`person.customFields ->> :${key} = :${key}`, {
        [`${key}`]: key,
        [`${key}`]: String(value),
      });
    }

    const matchingPersons = await qb.getMany();

    const newSegment = new Population();
    newSegment.name = segmentName;
    newSegment.user = parent.user;
    newSegment.parentPopulation = parent;
    newSegment.persons = matchingPersons;

    return this.populationRepo.save(newSegment);
  }

}
