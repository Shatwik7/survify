import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { QuestionnaireModule } from './questionnaire/questionnaire.module';
import { AuthModule } from '@app/auth';


describe('AppModule', () => {
    let moduleRef: TestingModule;
    jest.setTimeout(30000);

    beforeEach(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
    });
    afterAll(async () => {
        await moduleRef.close();
    });


    it('should be defined', () => {
        const appModule = moduleRef.get<AppModule>(AppModule);
        expect(appModule).toBeDefined();
    });

    it('should import QuestionnaireModule', () => {
        const questionnaireModule = moduleRef.select(QuestionnaireModule);
        expect(questionnaireModule).toBeDefined();
    });

    it('should import AuthModule', () => {
        const authModule = moduleRef.select(AuthModule);
        expect(authModule).toBeDefined();
    });

});
