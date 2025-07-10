import { OnQueueCompleted, OnQueueFailed, OnQueueProgress, OnQueueRemoved, OnQueueStalled, OnQueueWaiting, Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import * as ExcelJS from 'exceljs';
import { PersonDBService, PopulationDBService } from '@app/database';
import * as os from 'node:os';
import { Logger } from '@nestjs/common';
import { QueueUploadDto } from '../dto/queue-upload.dto';
import { FileStorageService } from '@app/file-storage';

@Processor('population')
export class PopulationUploadProcessor {
    private logger = new Logger(PopulationUploadProcessor.name);
    constructor(
        private readonly PersonDBService: PersonDBService,
        private readonly FileStorageService: FileStorageService,
        private readonly PopulationDBService: PopulationDBService
    ) { }

    @Process({ name: 'upload', concurrency: os.cpus().length * 2 })
    async handleUpload(job: Job<QueueUploadDto>) {
        const { filePath, population, lastRow = 0, total } = job.data;
        this.logger.log("JOB_STARTS");
        await this.PopulationDBService.updatePopulationStatus(population.id, "working");
        let progress = 0;

        let headers: string[] = [];

        let buffer: {
            email: string;
            name: string;
            phone: string;
            customFields: Record<string, any>;
        }[] = [];
        const BATCH_SIZE = 10000;
        let totalRows = 0;
        let processedRows = 0;
        const stream = await this.FileStorageService.getStream(filePath);
        let workbookReader: ExcelJS.stream.xlsx.WorkbookReader;
        try {
            workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(stream, {
                entries: 'emit',
                sharedStrings: 'cache',
                worksheets: 'emit',
                hyperlinks: 'ignore',
                styles: 'ignore',
            });
        } catch (err: any) {
            throw new Error("can't read the File");
        }

        if (!total || total == 0) {
            const stream2=await this.FileStorageService.getStream(filePath);
            const workbookReader2 = new ExcelJS.stream.xlsx.WorkbookReader(stream2, {
                entries: 'emit',
                sharedStrings: 'cache',
                worksheets: 'emit',
                hyperlinks: 'ignore',
                styles: 'ignore',
            });
            for await (const worksheet of workbookReader2) {
                for await (const row of worksheet) {
                    if (row){
                        totalRows++;
                    } 
                }
            }
            await job.update({ ...job.data, total: totalRows });
        } else {
            totalRows = total;
        }
        console.log(processedRows, total, totalRows, lastRow);

        for await (const worksheet of workbookReader) {
            for await (const row of worksheet) {
                if (row.number === 1) {
                    processedRows++;
                    headers = (row.values as any[]).slice(1);
                    console.log(headers);
                    continue;
                }
                if (row.number <= lastRow + 1) {
                    processedRows++;
                    continue;
                }
                const rowValues = row.values as any[];
                const record: Record<string, any> = {};
                headers.forEach((header, idx) => {
                    record[header?.toString().trim()] = rowValues[idx + 1];
                });
                const { email, name, phone, ...customFields } = record;
                if (!email) continue;
                buffer.push({
                    email,
                    name,
                    phone: phone,
                    customFields,
                });
                processedRows++;
                if (buffer.length >= BATCH_SIZE) {
                    await this.PersonDBService.addPersonsToPopulationWithIgnoreError(buffer, population.id);
                    buffer = [];
                    progress = Math.floor((processedRows / totalRows) * 99.99);
                    await job.progress(progress);
                    await job.update({ ...job.data, lastRow: processedRows });
                }
            }
        }

        if (buffer.length) {
            await this.PersonDBService.addPersonsToPopulationWithIgnoreError(buffer, population.id);
            buffer = [];
        }
        await job.progress(100);
    }


    @OnQueueCompleted({ name: 'upload' })
    async completed(job: Job<QueueUploadDto>) {
        const state = await job.getState();
        this.logger.log(`COMPLETED : ${job.id} with state: ${state}`);
        this.FileStorageService.delete(job.data.filePath);
        const toPopulationId = job.data.population.id;
        if (toPopulationId) {
            await this.PopulationDBService.updatePopulationStatus(toPopulationId, "completed");
        } else {
            this.logger.warn(`Job ${job.id} completed but toPopulation.id is missing in job data`);
        }
    }

    @OnQueueFailed({ name: 'upload' })
    async failed(job: Job<QueueUploadDto>) {
        const state = await job.getState();
        this.logger.log(`FAILED : ${job.id} with state: ${state}`);
        this.FileStorageService.delete(job.data.filePath);
        const toPopulationId = job.data.population.id;
        if (toPopulationId) {
            await this.PopulationDBService.updatePopulationStatus(toPopulationId, "failed");
        } else {
            this.logger.warn(`Job ${job.id} failed but toPopulation.id is missing in job data`);
        }
    }

    // @OnQueueStalled({ name: 'upload' })
    // async resolve(job: Job<QueueUploadDto>) {
    //     this.logger.warn(`Job ${job.id} stalled. Attempting to resolve...`);
    // }

    // @OnQueueWaiting({ name: 'upload' })
    // async waiting(job: Job<QueueUploadDto>) {
    //     this.logger.log(`JOB ${job.id} is waiting`);
    // }

    @OnQueueProgress({ name: "upload" })
    async progress(job: Job<QueueUploadDto>, data: any) {
        this.logger.log(`JOB ${job.id} is Progress :   `, data);
    }
}
