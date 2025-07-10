import { Module } from '@nestjs/common';
import { PopulationController } from './population.controller';
import { PopulationService } from './population.service';
import { AuthModule } from '@app/auth';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { BullModule } from '@nestjs/bull';
import { PopulationUploadProcessor } from './process/population-upload.processor';
import { SegmentProcessor } from './process/segmentation.processor';
import { FileStorageModule } from '@app/file-storage';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
  }),
    AuthModule,
    DatabaseModule,
    FileStorageModule,
  BullModule.registerQueue({
    name: 'population',
  }),],
  controllers: [PopulationController],
  providers: [PopulationService, PopulationUploadProcessor, SegmentProcessor],
})
export class PopulationModule { }


// 1- large excel file streaming and storing in database
// 2- population mangement
//          ├── creating manualy, excel,
//          ├── creating segments through queries and filters on the person's custom fields and responses,
// 3- person mangement
//          ├── add person to existing populations
//          |                  ├── manually
//          |                  └── excel
//          ├── deleting person from exiting populations
//          |                  ├── manually
//          |                  └── through queries and filtering and duplication solving
//          └── updating person ( updating custom fields )
//                             └── using filtering