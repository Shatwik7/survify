import { Inject, Injectable } from '@nestjs/common';
import { IStorageService } from './storage.interface';
import { Readable } from 'stream';

@Injectable()
export class FileStorageService {
  constructor(
    @Inject('StorageService') private storageService: IStorageService,
  ) {}

  upload(file: Express.Multer.File): Promise<string> {
    return this.storageService.uploadFile(file);
  }

  delete(fileKey: string): Promise<void> {
    return this.storageService.deleteFile(fileKey);
  }

  getBuffer(fileKey:string): Promise<Buffer>{
    return this.storageService.getFileBuffer(fileKey);
  }

  getStream(fileKey:string):Promise<Readable>{
    return this.storageService.getFileStream(fileKey);
  }


}