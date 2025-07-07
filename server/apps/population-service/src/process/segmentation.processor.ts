import { Processor, Process, OnQueueCompleted, OnQueueFailed, OnQueueCleaned, OnQueueRemoved, OnQueueStalled } from '@nestjs/bull';
import { Job } from 'bull';
import { PersonDBService, Population, PopulationDBService } from '@app/database';
import { Logger } from '@nestjs/common';
import * as os from 'node:os';
import { FilterGroup } from '../dto/filter.types'
import { filterPersons } from '../utils/filter.util';
import { QueueSegmentDto } from '../dto/queue-segment.dto';

@Processor('population')
export class SegmentProcessor {
    private readonly logger = new Logger(SegmentProcessor.name);

    constructor(
        private readonly PopulationDBService: PopulationDBService,
        private readonly PersonDBService: PersonDBService,
    ) { }

    @Process({ name: 'segmentation', concurrency: os.cpus().length * 2 > 1 ? os.cpus().length * 2 : 1 })
    async handle(job: Job<QueueSegmentDto>) {
            const data: QueueSegmentDto = job.data;
            this.logger.log(`Segment "${data.toPopulation.name}" created with ID ${data.toPopulation.id}`);
            await this.PopulationDBService.updatePopulationStatus(data.toPopulation.id, "working");
            await this.filterAndInsertPopulation(data.fromPopulation, data.filter, data.toPopulation, job, data.total, data.lastSuccessfulPage);
            await job.progress(100);
            this.logger.log(`All Persons Add To Segment "${data.toPopulation.id}"`);
    }

    async filterAndInsertPopulation(fromPopulation: Population, filter: FilterGroup, toPopualtion: Population, job: Job<QueueSegmentDto>, total: number, startPage: number = 0) {
        let page = startPage + 1;
        while (true) {
            const { data, hasNextPage } = await this.PersonDBService.fetchPersonsFromPopulationInPages(fromPopulation.id, page);
            const filtered = filterPersons(data, filter);
            await this.PersonDBService.storePersonsInPopulationFromAnotherPopulation(filtered, toPopualtion.id);
            const a = job.update({ ...job.data, lastSuccessfulPage: page });
            const b = job.progress(Math.floor((page * 1000 / total) * 99))
            await Promise.all([a, b]);
            if (!hasNextPage) break;
            page++;
        }
    }

    @OnQueueCompleted({name: 'segmentation'})
    async completed(job: Job<QueueSegmentDto>) {
        const state=await job.getState()
        this.logger.log("COMPLETED : ",job.id," with ",state);
        await this.PopulationDBService.updatePopulationStatus(job.data.toPopulation.id, "completed");
    }

    @OnQueueFailed({name: 'segmentation'})
    async failed(job:Job<QueueSegmentDto>){
        const state=await job.getState()
        this.logger.log("FAILED : ",job.id," with ",state);
        await this.PopulationDBService.updatePopulationStatus(job.data.toPopulation.id, "failed");
    }

    @OnQueueStalled({name: 'segmentation'})
    async resolve(job:Job<QueueSegmentDto>,){
        this.logger.warn(`Job ${job.id} stalled. Attempting to resolve...`);
    }
}
