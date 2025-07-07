import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Survey, SurveyService, SurveyAccessService, PersonDBService, PopulationDBService, QuestionnaireDBService, UserService } from '@app/database';
import { SurveyTestFactory, TestData } from './test-factories/survey.factory';
import { v4 as uuidv4 } from 'uuid';

describe('Survey E2E (Simplified)', () => {
  let app: INestApplication;
  let testFactory: SurveyTestFactory;
  let testData: TestData;
  let skipCleanup = false;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Initialize test factory
    const jwtService = moduleFixture.get<JwtService>(JwtService);
    const userService = moduleFixture.get<UserService>(UserService);
    const surveyService = moduleFixture.get<SurveyService>(SurveyService);
    const surveyAccessService = moduleFixture.get<SurveyAccessService>(SurveyAccessService);
    const personDBService = moduleFixture.get<PersonDBService>(PersonDBService);
    const populationDBService = moduleFixture.get<PopulationDBService>(PopulationDBService);
    const questionnaireDBService = moduleFixture.get<QuestionnaireDBService>(QuestionnaireDBService);

    testFactory = new SurveyTestFactory(
      jwtService,
      userService,
      questionnaireDBService,
      populationDBService,
      personDBService,
      surveyService,
      surveyAccessService,
    );
  });

  beforeEach(async () => {
    testData = await testFactory.createTestData();
    skipCleanup = false;
  });

  afterEach(async () => {
    if (!skipCleanup && testData) {
      await testFactory.cleanupTestData(testData);
    }
  });

  afterAll(async () => {
    // Final cleanup in case any tests skipped cleanup
    if (testData) {
      await testFactory.cleanupTestData(testData);
    }
    await app.close();
  });

  describe('Survey Creation', () => {
    it('should create a new survey', async () => {
      const createSurveyDto = {
        questionnaireId: testData.questionnaire.id,
        populationId: testData.population.id,
        deliveryModes: ['email'],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const userJwt = testFactory.generateUserJwt(testData.user);

      const response = await request(app.getHttpServer())
        .post('/survey')
        .set('Authorization', `Bearer ${userJwt}`)
        .send(createSurveyDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.questionnaireId).toBe(testData.questionnaire.id);
      expect(response.body.populationId).toBe(testData.population.id);
      expect(response.body.deliveryModes).toEqual(['email']);
      expect(response.body.analyzed).toBe(false);
    });
  });

  describe('Survey Access', () => {
    it('should return survey questions for valid JWT', async () => {
      const response = await request(app.getHttpServer())
        .get(`/survey/questions/${testData.surveyJwt}`)
        .expect(200);

      expect(response.body).toHaveProperty('surveyId', testData.survey.id);
      expect(response.body).toHaveProperty('questionnaire');
      expect(response.body.questionnaire).toHaveProperty('id', testData.questionnaire.id);
      expect(response.body.questionnaire).toHaveProperty('title', 'Test Questionnaire');
      expect(response.body.questionnaire).toHaveProperty('questions');
      expect(response.body.questionnaire.questions.length).toBeGreaterThan(0);
    });

    it('should return 404 for invalid JWT', async () => {
      const invalidJwt = testFactory.generateInvalidJwt();

      await request(app.getHttpServer())
        .get(`/survey/questions/${invalidJwt}`)
        .expect(404);
    });
  });

  describe('Answer Submission', () => {
    it('should submit answers successfully', async () => {
      // Get questions first to get their IDs
      const questionsResponse = await request(app.getHttpServer())
        .get(`/survey/questions/${testData.surveyJwt}`)
        .expect(200);

      const questions = questionsResponse.body.questionnaire.questions;
      const answers: any = {};
      
      questions.forEach((question: any) => {
        switch (question.type) {
          case 'text':
            answers[question.id] = ['Test Answer'];
            break;
          case 'number':
            answers[question.id] = ['25'];
            break;
          case 'select':
            answers[question.id] = [question.options[0]];
            break;
          case 'checkbox':
            answers[question.id] = ['true'];
            break;
          case 'date':
            answers[question.id] = ['2023-01-01'];
            break;
        }
      });
      console.log("answer :",answers);
      const submitAnswersDto = {
        jwt: testData.surveyJwt,
        answers,
      };

      await request(app.getHttpServer())
        .post('/survey/submit')
        .send(submitAnswersDto)
        .expect(201);
    });
  });

  describe('Survey Statistics', () => {
    it('should return survey statistics', async () => {
      const userJwt = testFactory.generateUserJwt(testData.user);

      const response = await request(app.getHttpServer())
        .get(`/survey/${testData.survey.id}/stats`)
        .set('Authorization', `Bearer ${userJwt}`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('seen');
      expect(response.body).toHaveProperty('completed');
      expect(typeof response.body.total).toBe('number');
      expect(typeof response.body.seen).toBe('number');
      expect(typeof response.body.completed).toBe('number');
    });
  });

  describe('Survey Job Status', () => {
    it('should return survey job status', async () => {
      const userJwt = testFactory.generateUserJwt(testData.user);

      const response = await request(app.getHttpServer())
        .get(`/survey/${testData.survey.id}/job-status`)
        .set('Authorization', `Bearer ${userJwt}`)
        .expect(200);

      expect(response.body).toHaveProperty('sendJobStatus');
      expect(response.body).toHaveProperty('sendProgress');
      expect(response.body.sendJobStatus).toBe('NotStarted');
      expect(typeof response.body.sendProgress).toBe('number');
    });
  });

  describe('Survey Sending', () => {
    it('should send survey links', async () => {
      // Use the existing test factory but ensure isolation
      const isolatedTestData = await testFactory.createTestData();
      
      const userJwt = testFactory.generateUserJwt(isolatedTestData.user);
      
      // Add a small delay to ensure data is committed
      await new Promise(resolve => setTimeout(resolve, 100));

      await request(app.getHttpServer())
        .post(`/survey/${isolatedTestData.survey.id}/send`)
        .set('Authorization', `Bearer ${userJwt}`)
        .expect(201);

      // Clean up the isolated test data immediately
      await testFactory.cleanupTestData(isolatedTestData);
    });
  });

  describe('Error Handling', () => {
    it('should handle unauthorized access', async () => {
      await request(app.getHttpServer())
        .post('/survey')
        .send({})
        .expect(401);
    });

    it('should handle missing resources', async () => {
      const userJwt = testFactory.generateUserJwt(testData.user);

      await request(app.getHttpServer())
        .get(`/survey/${uuidv4()}`) // Use valid UUID format
        .set('Authorization', `Bearer ${userJwt}`)
        .expect(404);
    });
  });
}); 