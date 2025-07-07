import { Readable } from "stream";

export interface IStorageService {
  uploadFile(file: Express.Multer.File): Promise<string>;
  deleteFile(fileKey: string): Promise<void>;
  getFileBuffer(fileKey: string): Promise<Buffer>;
  getFileStream(fileKey:string):Promise<Readable>;
}