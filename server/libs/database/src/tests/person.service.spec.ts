import { PersonDBService } from '../services/person.service';
import { Repository, DataSource } from 'typeorm';
import { Population } from '../entities/population.entity';
import { Person } from '../entities/person.entity';



describe('PersonDBService', () => {
    jest.mock('@nestjs/common', () => ({
        Injectable: () => { },
        Logger: jest.fn().mockImplementation(() => ({
            error: jest.fn(),
            log: jest.fn(),
        })),
    }));

    const mockPopulationRepo = () => ({
        findOne: jest.fn(),
        save: jest.fn(),
    });
    const mockPersonRepo = () => ({
        create: jest.fn(),
        save: jest.fn(),
        findAndCount: jest.fn(),
        findOne: jest.fn(),
        findBy: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        createQueryBuilder: jest.fn(), // Add this line to mock createQueryBuilder
    });
    const mockDataSource = () => ({
        transaction: jest.fn(),
    });
    let service: PersonDBService;
    let populationRepo: ReturnType<typeof mockPopulationRepo>;
    let personRepo: ReturnType<typeof mockPersonRepo>;
    let dataSource: ReturnType<typeof mockDataSource>;

    beforeEach(() => {
        populationRepo = mockPopulationRepo();
        personRepo = mockPersonRepo();
        dataSource = mockDataSource();
        service = new PersonDBService(
            populationRepo as any as Repository<Population>,
            personRepo as any as Repository<Person>,
            dataSource as any as DataSource
        );
    });

    it('should add a person to a population', async () => {
        const personData = { email: 'a@b.com', name: 'A', phone: '123', customFields: {} };
        const populationId = 'pop1';
        const created = { ...personData, populations: [{ id: populationId }] };
        personRepo.create.mockReturnValue(created);
        personRepo.save.mockResolvedValue(created);

        const result = await service.addPersonToPopulation(personData, populationId);
        expect(personRepo.create).toHaveBeenCalledWith({ ...personData, populations: [{ id: populationId }] });
        expect(personRepo.save).toHaveBeenCalledWith(created);
        expect(result).toEqual(created);
    });

    it('should add persons to population and ignore error', async () => {
        const persons = [
            { email: 'a@b.com', name: 'A', phone: '123', customFields: {} },
            { email: 'b@b.com', name: 'B', phone: '456', customFields: {} },
        ];
        const populationId = 'pop1';
        const created = persons.map(p => ({ ...p, populations: [{ id: populationId }] }));
        personRepo.create.mockReturnValue(created);
        personRepo.save.mockResolvedValue(created);

        const result = await service.addPersonsToPopulationWithIgnoreError(persons, populationId);
        expect(result).toBe(true);
    });

    it('should return false if addPersonsToPopulationWithIgnoreError throws', async () => {
        personRepo.create.mockImplementation(() => { throw new Error('fail'); });
        const result = await service.addPersonsToPopulationWithIgnoreError([], 'pop1');
        expect(result).toBe(false);
    });

    it('should get all persons paginated', async () => {
        const persons = [{ id: '1' }, { id: '2' }];
        personRepo.findAndCount.mockResolvedValue([persons, 2]);
        const result = await service.getall();
        expect(personRepo.findAndCount).toHaveBeenCalledWith({ skip: 0, take: 20 });
        expect(result).toEqual(persons);
    });

    it('should remove person from population', async () => {
        const population = { id: 'pop1', persons: [{ id: 'p1' }, { id: 'p2' }] };
        populationRepo.findOne.mockResolvedValue(population);
        populationRepo.save.mockResolvedValue({});
        personRepo.findOne.mockResolvedValue({ id: 'p1', populations: [{ id: 'pop1' }] });
        personRepo.save.mockResolvedValue({});

        await service.removePersonFromPopulation('p1', 'pop1');
        expect(populationRepo.save).toHaveBeenCalled();
        expect(personRepo.save).toHaveBeenCalled();
    });

    it('should do nothing if population not found in removePersonFromPopulation', async () => {
        populationRepo.findOne.mockResolvedValue(undefined);
        await service.removePersonFromPopulation('p1', 'pop1');
        expect(populationRepo.save).not.toHaveBeenCalled();
    });

    it('should remove persons from population', async () => {
        const population = { id: 'pop1', persons: [{ id: 'p1' }, { id: 'p2' }] };
        populationRepo.findOne.mockResolvedValue(population);
        populationRepo.save.mockResolvedValue({});
        personRepo.findBy.mockResolvedValue([
            { id: 'p1', populations: [{ id: 'pop1' }] },
            { id: 'p2', populations: [{ id: 'pop1' }] },
        ]);
        personRepo.save.mockResolvedValue({});

        await service.removePersonsFromPopulation(['p1', 'p2'], 'pop1');
        expect(populationRepo.save).toHaveBeenCalled();
        expect(personRepo.save).toHaveBeenCalled();
    });

    it('should delete a person', async () => {
        personRepo.delete.mockResolvedValue({});
        await service.delete('p1');
        expect(personRepo.delete).toHaveBeenCalledWith('p1');
    });

    it('should fetch persons from population in pages', async () => {
        const qb = {
            innerJoin: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getManyAndCount: jest.fn().mockResolvedValue([[{ id: 'p1' }], 1]),
        };
        personRepo.createQueryBuilder = jest.fn().mockReturnValue(qb as any);

        const result = await service.fetchPersonsFromPopulationInPages('pop1', 1, 1);
        expect(result).toEqual({ data: [{ id: 'p1' }], hasNextPage: false });
    });

    it('should store persons in population from another population', async () => {
        const persons = [{ id: 'p1' }, { id: 'p2' }] as Person[];
        dataSource.transaction.mockImplementation(async cb => cb({ query: jest.fn() }));

        await service.storePersonsInPopulationFromAnotherPopulation(persons, 'pop1');
        expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('should not store if persons array is empty', async () => {
        await service.storePersonsInPopulationFromAnotherPopulation([], 'pop1');
        expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should remove person-population relation', async () => {
        dataSource.transaction.mockImplementation(async cb => cb({ query: jest.fn() }));
        await service.removePersonPopulationRelation('p1', 'pop1');
        expect(dataSource.transaction).toHaveBeenCalled();
    });

    // it('should call updatePersonPopulation', async () => {
    //     personRepo.count.mockResolvedValue(2);
    //     const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
    //     await service.updatePersonPopulation('p1', 'pop1', {} as Person);
    //     expect(personRepo.count).toHaveBeenCalled();
    //     expect(consoleSpy).toHaveBeenCalled();
    //     consoleSpy.mockRestore();
    // });
});

// import { ConfigModule } from '@nestjs/config';

// describe('PersonDB', () => {
//     let module: TestingModule;
//     let service: PersonDBService;
//     beforeAll(async () => {
//         module = await Test.createTestingModule({
//             imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule]
//         }).compile();
//         service = module.get<PersonDBService>(PersonDBService);
//     })

//     // it('its defined',async ()=>{
//     //     const person:Partial<Person>={
//     //         "email": "tammy70@example.net",
//     //         "name": "Jennifer Rivera",
//     //         "phone": "6453685477",
//     //         "customFields": {
//     //             "age": 19,
//     //             "address": "913 Cheryl Mills Suite 569, New John, IL 01397"
//     //         },
//     //     };
//     //     const persons=await service.updatePersonInPopulation("0004aeae-f34f-45c0-8fef-7872b5a09e48","3c2a1b8-69a4-4977-95ed-23991fda2107",person);
//     //     expect(persons).toBe(true);
//     // })

// })

// describe('PersonDBService (integration with DB)', () => {
//     let module: TestingModule;
//     let service: PersonDBService;
//     let dataSource: DataSource;

//     beforeAll(async () => {
//         module = await Test.createTestingModule({
//             imports: [
//                 TypeOrmModule.forRoot({
//                     type: 'sqlite',
//                     database: ':memory:',
//                     dropSchema: true,
//                     entities: [Person, Population],
//                     synchronize: true,
//                 }),
//                 TypeOrmModule.forFeature([Person, Population]),
//             ],
//             providers: [PersonDBService],
//         }).compile();

//         service = module.get<PersonDBService>(PersonDBService);
//         dataSource = module.get<DataSource>(DataSource);
//     });

//     afterAll(async () => {
//         await dataSource.destroy();
//         await module.close();
//     });

//     it('should add and fetch a person in a population', async () => {
//         // Create a population
//         const populationRepo = dataSource.getRepository(Population);
//         const population = populationRepo.create({ name: 'TestPop' });
//         await populationRepo.save(population);

//         // Add person
//         const personData = { email: 'test@a.com', name: 'Test', phone: '111', customFields: {} };
//         const person = await service.addPersonToPopulation(personData, population.id);

//         expect(person.id).toBeDefined();
//         expect(person.populations[0].id).toBe(population.id);

//         // Fetch persons in population
//         const { data, hasNextPage } = await service.fetchPersonsFromPopulationInPages(population.id, 1, 10);
//         expect(data.length).toBe(1);
//         expect(data[0].email).toBe('test@a.com');
//         expect(hasNextPage).toBe(false);
//     });

//     it('should remove a person from a population', async () => {
//         // Create a population and person
//         const populationRepo = dataSource.getRepository(Population);
//         const personRepo = dataSource.getRepository(Person);
//         const population = populationRepo.create({ name: 'Pop2' });
//         await populationRepo.save(population);

//         const person = personRepo.create({ email: 'rem@a.com', name: 'Rem', phone: '222', customFields: {}, populations: [population] });
//         await personRepo.save(person);

//         // Remove person from population
//         await service.removePersonFromPopulation(person.id, population.id);

//         const updatedPerson = await personRepo.findOne({ where: { id: person.id }, relations: ['populations'] });
//         expect(updatedPerson?.populations.length).toBe(0);
//     });

//     it('should delete a person', async () => {
//         const personRepo = dataSource.getRepository(Person);
//         const person = personRepo.create({ email: 'del@a.com', name: 'Del', phone: '333', customFields: {} });
//         await personRepo.save(person);

//         await service.delete(person.id);

//         const found = await personRepo.findOne({ where: { id: person.id } });
//         expect(found).toBeNull();
//     });

//     it('should add multiple persons to a population and ignore errors', async () => {
//         const populationRepo = dataSource.getRepository(Population);
//         const population = populationRepo.create({ name: 'Pop3' });
//         await populationRepo.save(population);

//         const persons = [
//             { email: 'a@a.com', name: 'A', phone: '1', customFields: {} },
//             { email: 'b@a.com', name: 'B', phone: '2', customFields: {} },
//         ];

//         const result = await service.addPersonsToPopulationWithIgnoreError(persons, population.id);
//         expect(result).toBe(true);

//         const personRepo = dataSource.getRepository(Person);
//         const all = await personRepo.find({ relations: ['populations'] });
//         expect(all.length).toBeGreaterThanOrEqual(2);
//         expect(all[0].populations[0].id).toBe(population.id);
//     });
// });
