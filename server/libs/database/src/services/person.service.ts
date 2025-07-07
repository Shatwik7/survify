import { Injectable, Logger } from "@nestjs/common";
import { Population } from "../entities/population.entity";
import { Person } from "../entities/person.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";

@Injectable()
export class PersonDBService {
    private readonly logger: Logger = new Logger()

    constructor(
        @InjectRepository(Population) private populationRepo: Repository<Population>,
        @InjectRepository(Person) private personRepo: Repository<Person>,
        private dataSource: DataSource,
    ) { }

    public addPersonToPopulation(Person: { email: string, name: string, phone: string, customFields: Record<string, any> }, populationId: string): Promise<Person> {
        const person = this.personRepo.create({
            ...Person,
            populations: [{ id: populationId }],
        });
        return this.personRepo.save(person);
    }

    public async addPersonsToPopulationWithIgnoreError
    (
        Persons: { 
            email: string, 
            name: string, 
            phone: string, 
            customFields: Record<string, any> 
        }[],
        populationId: string
    ): Promise<Boolean> {
        try {
            const persons = this.personRepo.create(
                Persons.map(p => ({
                    name: p.name,
                    email: p.email,
                    phone: p.phone,
                    customFields: p.customFields,
                    populations: [{ id: populationId }]
                }))
            );
            await this.personRepo.save(persons);
            return true;
        } catch (err) {
            this.logger.error(err);
            return false;
        }
    }
    public async getall() {
        const page = 1;
        const limit = 20;
        const [persons, total] = await this.personRepo.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
        });
        console.log(persons);
        return persons
    }

    public async removePersonFromPopulation(personId: string, populationId: string): Promise<void> {
        const population = await this.populationRepo.findOne({
            where: { id: populationId }
        });
        if (!population) return;
        population.persons = population.persons.filter(person => person.id !== personId);
        await this.populationRepo.save(population);
        const person = await this.personRepo.findOne({ where: { id: personId } });
        if (person?.populations) {
            person.populations.filter(population => population.id !== populationId);
            await this.personRepo.save(person);
        }
    }

    public async removePersonsFromPopulation(personIds: string[], populationId: string): Promise<void> {
        const population = await this.populationRepo.findOne({
            where: { id: populationId }
        });
        if (!population) return;
        population.persons = population.persons.filter(person => personIds.includes(person.id));
        await this.populationRepo.save(population);
        const persons = await this.personRepo.findBy(personIds.map(id => ({ "id": id })));
        persons.map(person => ({
            ...person,
            populations: person.populations.filter(population => population.id !== populationId)
        }))
        await this.personRepo.save(persons);
    }

    public async delete(personId: string): Promise<void> {
        await this.personRepo.delete(personId);
    }

    async fetchPersonsFromPopulationInPages(
        populationId: string,
        page = 1,
        limit = 1000
    ): Promise<{ data: Person[]; hasNextPage: boolean }> {
        const [data, total] = await this.personRepo
            .createQueryBuilder('person')
            .innerJoin('person.populations', 'population', 'population.id = :populationId', { populationId })
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return {
            data,
            hasNextPage: page * limit < total,
        };
    }

    async storePersonsInPopulationFromAnotherPopulation(persons: Person[], populationId: string): Promise<void> {
        if (!persons.length) return;

        // Prepare INSERT values
        const values = persons
            .map(p => `('${p.id}', '${populationId}')`)
            .join(',');

        await this.dataSource.transaction(async manager => {
            await manager.query(`
            INSERT INTO person_population ("personId", "populationId")
            VALUES ${values}
            ON CONFLICT DO NOTHING
            `);
        });
    }

    async removePersonPopulationRelation(personId: string, populationId: string): Promise<void> {
        await this.dataSource.transaction(async manager => {
            await manager.query(
                `DELETE FROM person_population WHERE "personId" = $1 AND "populationId" = $2`,
                [personId, populationId]
            );
        });
    }

    async updatePersonInPopulation(personId:string,person:Partial<Person>){
        const a=await this.personRepo.update({id:personId},person);
        return a.affected!>0
    }

}