import { LocalStorageService } from './local.storage';
import { S3StorageService } from './s3.storage';
import { IStorageService } from './storage.interface';

export const storageFactory = {
  provide: 'StorageService',
  useFactory: (): IStorageService => {
    const driver = process.env.STORAGE_DRIVER || 'local';
    if (driver === 's3') {
      return new S3StorageService();
    } else {
      return new LocalStorageService();
    }
  },
};
