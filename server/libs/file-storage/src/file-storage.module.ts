import { Module } from '@nestjs/common';
import { FileStorageService } from './file-storage.service';
import { storageFactory } from './storage.factory';
import { LocalStorageService } from './local.storage';
import { S3StorageService } from './s3.storage';

@Module({
  providers: [storageFactory, FileStorageService,LocalStorageService,S3StorageService],
  exports: [FileStorageService],
})
export class FileStorageModule {}
