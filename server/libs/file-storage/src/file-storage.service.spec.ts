import { Test, TestingModule } from '@nestjs/testing';
import { FileStorageService } from './file-storage.service';
import { IStorageService } from './storage.interface';
import { Readable } from 'stream';

describe('FileStorageService', () => {
  let service: FileStorageService;
  let storageService: jest.Mocked<IStorageService>;

  beforeEach(async () => {
    const mockStorageService: jest.Mocked<IStorageService> = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
      getFileBuffer: jest.fn(),
      getFileStream: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileStorageService,
        { provide: 'StorageService', useValue: mockStorageService },
      ],
    }).compile();
    service = module.get(FileStorageService);
    storageService = module.get('StorageService');
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should upload file', async () => {
    const file = { originalname: 'test.txt' } as Express.Multer.File;
    storageService.uploadFile.mockResolvedValue('file-key');
    const result = await service.upload(file);
    expect(storageService.uploadFile).toHaveBeenCalledWith(file);
    expect(result).toBe('file-key');
  });

  it('should delete file', async () => {
    storageService.deleteFile.mockResolvedValue();
    await service.delete('file-key');
    expect(storageService.deleteFile).toHaveBeenCalledWith('file-key');
  });

  it('should get buffer', async () => {
    const buffer = Buffer.from('data');
    storageService.getFileBuffer.mockResolvedValue(buffer);
    const result = await service.getBuffer('file-key');
    expect(storageService.getFileBuffer).toHaveBeenCalledWith('file-key');
    expect(result).toBe(buffer);
  });

  it('should get stream', async () => {
    const stream = new Readable();
    storageService.getFileStream.mockResolvedValue(stream);
    const result = await service.getStream('file-key');
    expect(storageService.getFileStream).toHaveBeenCalledWith('file-key');
    expect(result).toBe(stream);
  });
}); 