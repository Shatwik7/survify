import { IStorageService } from './storage.interface';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { Readable } from 'stream';

@Injectable()
export class LocalStorageService implements IStorageService {
    private uploadDir = path.join(__dirname, '..', '..', '..', '..', 'uploads');
    private logger = new Logger(LocalStorageService.name);

    constructor() {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async uploadFile(file: Express.Multer.File): Promise<string> {
        console.log("file uploader local service hit");
        const filename = `${randomUUID()}-${file.originalname}`;
        const filepath = path.join(this.uploadDir, filename);
        fs.writeFileSync(filepath, file.buffer);
        return filename;
    }

    async getFileBuffer(fileKey: string): Promise<Buffer> {
        const filePath = path.join(this.uploadDir, path.basename(fileKey));
        this.logger.log(`Looking for file: ${fileKey}`, filePath);
        if (!fs.existsSync(filePath)) {
            throw new NotFoundException(`File not found: ${fileKey}`);
        }
        this.logger.log(`File Found Buffering`);
        return fs.promises.readFile(filePath);
    }

    async getFileStream(fileKey: string): Promise<Readable> {
        const filePath = path.join(this.uploadDir, path.basename(fileKey));
        this.logger.log(`Looking for file: ${fileKey}`, filePath);
        if (!fs.existsSync(filePath)) {
            throw new NotFoundException(`File not found: ${fileKey}`);
        }
        
        this.logger.log(`File Found Streaming`);
        return fs.createReadStream(filePath);
    }
    async deleteFile(fileKey: string): Promise<void> {
        const filepath = path.join(this.uploadDir, path.basename(fileKey));
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    }
}
