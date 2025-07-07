import { NestFactory } from '@nestjs/core';
import { PopulationServiceModule } from './population-service.module';
import { Queue } from 'bull';
import { getQueueToken } from '@nestjs/bull';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const serverAdapter = new ExpressAdapter();

  const app = await NestFactory.create(PopulationServiceModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      "stopAtFirstError": false,
    }),
  );
  if (process.env.MODE !== "PRODUCTION") {
    serverAdapter.setBasePath('/admin/queues');
    const queue = app.get<Queue>(getQueueToken('population'));
    createBullBoard({
      queues: [new BullAdapter(queue)],
      serverAdapter,
    });
    app.use('/admin/queues', serverAdapter.getRouter());
  }

  app.listen(3002).then(() => {
    console.log("Listining on port 3002");
  });
}
bootstrap()