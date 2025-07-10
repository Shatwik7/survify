import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
// import { Queue } from 'bull';
// import { getQueueToken } from '@nestjs/bull';
// import { BullAdapter } from '@bull-board/api/bullAdapter';
// import { createBullBoard } from '@bull-board/api';
import { ExpressAdapter } from '@bull-board/express';
dotenv.config();
const logger = new Logger();

export async function bootstrap() {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
      disableErrorMessages: false,
    }),
  );
  // const queue = app.get<Queue>(getQueueToken('openai-questionnare-generator'));
  // createBullBoard({
  //   queues: [new BullAdapter(queue)],
  //   serverAdapter,
  // });
  // app.use('/admin/queues', serverAdapter.getRouter());
  app.useLogger(['log', 'error', 'warn', 'debug']);
  const Port = process.env.PORT ?? 3000;
  await app.listen(Port).then(() => logger.log(`Listing on Port : ${Port}`));
}
bootstrap().catch((error) => {
  logger.error(error);
});
