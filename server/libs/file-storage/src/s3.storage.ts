import { IStorageService } from './storage.interface';
import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { Readable } from 'typeorm/platform/PlatformTools';

@Injectable()
export class S3StorageService implements IStorageService {
    private readonly s3 = new S3Client({
        region: process.env.AWS_REGION!,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY!,
            secretAccessKey: process.env.AWS_SECRET_KEY!,
        },
    });

    private readonly bucket = process.env.AWS_BUCKET_NAME!;

    async uploadFile(file: Express.Multer.File): Promise<string> {
        const key = `${crypto.randomUUID()}-${file.originalname}`;
        await this.s3.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
            }),
        );
        return key;
    }

    async getFileBuffer(fileKey: string): Promise<Buffer> {
        const res = await this.s3.send(
            new GetObjectCommand({
                Bucket: this.bucket,
                Key: fileKey,
            }),
        );

        const stream = res.Body as Readable;

        return new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', reject);
        });
    }

    async getFileStream(fileKey: string): Promise<Readable> {
        const res = await this.s3.send(
            new GetObjectCommand({
                Bucket: this.bucket,
                Key: fileKey,
            }),
        );
        return res.Body as Readable;
    }

    async deleteFile(fileKey: string): Promise<void> {
        await this.s3.send(
            new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: fileKey,
            }),
        );
    }
}
