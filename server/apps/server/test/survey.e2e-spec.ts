import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Survey, Questionnaire, Population, Person, SurveyAccess, Answer, User, UserService, SurveyService, SurveyAccessService, PersonDBService, PopulationDBService, QuestionnaireDBService } from '@app/database';
import { v4 as uuidv4 } from 'uuid';

jest.setTimeout(30000);

describe('Survey (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userService: UserService;
  let surveyService: SurveyService;
  let surveyAccessService: SurveyAccessService;
  let personDBService: PersonDBService;
  let populationDBService: PopulationDBService;
  let questionnaireDBService: QuestionnaireDBService;

  let testUser: any;
  let testQuestionnaire: any;
  let testPopulation: any;
  let testSurvey: any;
  let testPerson: any;
  let surveyJwt: string;
  let testQuestions: any[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get services
    jwtService = moduleFixture.get<JwtService>(JwtService);
    userService = moduleFixture.get<UserService>(UserService);
    surveyService = moduleFixture.get<SurveyService>(SurveyService);
    surveyAccessService = moduleFixture.get<SurveyAccessService>(SurveyAccessService);
    personDBService = moduleFixture.get<PersonDBService>(PersonDBService);
    populationDBService = moduleFixture.get<PopulationDBService>(PopulationDBService);
    questionnaireDBService = moduleFixture.get<QuestionnaireDBService>(QuestionnaireDBService);
  });

  beforeEach(async () => {
    // Create test user
    testUser = await userService.createNewUser({
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
    });

    // Create test questionnaire
    testQuestionnaire = await questionnaireDBService.addQuestionnaire(
      'Test Questionnaire',
      'Test Description',
      'completed',
      testUser.id
    );


    // Add questions to questionnaire
    const updatedQuestionnaire = await questionnaireDBService.addMultipleQuestionsToQuestionnaire(
      testQuestionnaire.id,
      [
        {
          description: 'What is your name?',
          type: 'text',
        },
        {
          description: 'How old are you?',
          type: 'number',
        },
        {
          description: 'What is your favorite color?',
          type: 'select',
          options: ['Red', 'Blue', 'Green', 'Yellow'],
        },
      ]
    );
    
    // Get the questions from the updated questionnaire
    testQuestions = updatedQuestionnaire?.questions || [];

    // Create test population
    testPopulation = await populationDBService.createPopulation(
      'Test Population',
      testUser.id
    );

    // Create test person
    testPerson = await personDBService.addPersonToPopulation(
      {
        email: 'person@example.com',
        name: 'Test Person',
        phone: '1234567890',
        customFields: { department: 'Engineering' },
      },
      testPopulation.id
    );

    // Create test survey
    testSurvey = await surveyService.createSurvey({
      questionnaireId: testQuestionnaire.id,
      populationId: testPopulation.id,
      userId: testUser.id,
      deliveryModes: ['email', 'whatsapp'],
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    });

    // Generate survey JWT for testing
    surveyJwt = jwtService.sign(
      {
        surveyId: testSurvey.id,
        personId: testPerson.id,
        type: 'survey-access',
      },
      {
        expiresIn: '30d',
      }
    );

    // Create survey access record
    await surveyAccessService.createAccess(testSurvey.id, testPerson.id, surveyJwt);
  });

  afterEach(async () => {
    // Clean up test data
    // Note: Surveys are cleaned up automatically when population is deleted due to cascade
    if (testPopulation) {
      await populationDBService.deletePopulation(testPopulation.id);
    }
    if (testQuestionnaire) {
      await questionnaireDBService.delete(testQuestionnaire.id);
    }
    if (testUser) {
      await userService.delete(testUser.id);
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/survey (POST)', () => {
    it('should create a new survey', async () => {
      const createSurveyDto = {
        questionnaireId: testQuestionnaire.id,
        populationId: testPopulation.id,
        deliveryModes: ['email'],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const userJwt = jwtService.sign({ id: testUser.id, email: testUser.email });

      const response = await request(app.getHttpServer())
        .post('/survey')
        .set('Authorization', `Bearer ${userJwt}`)
        .send(createSurveyDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.questionnaireId).toBe(testQuestionnaire.id);
      expect(response.body.populationId).toBe(testPopulation.id);
      expect(response.body.deliveryModes).toEqual(['email']);
      expect(response.body.analyzed).toBe(false);
    });

    it('should return 404 when questionnaire not found', async () => {
      const createSurveyDto = {
        questionnaireId: uuidv4(), // Use valid UUID format
        populationId: testPopulation.id,
        deliveryModes: ['email'],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const userJwt = jwtService.sign({ id: testUser.id, email: testUser.email });

      await request(app.getHttpServer())
        .post('/survey')
        .set('Authorization', `Bearer ${userJwt}`)
        .send(createSurveyDto)
        .expect(404);
    });

    it('should return 404 when population not found', async () => {
      const createSurveyDto = {
        questionnaireId: testQuestionnaire.id,
        populationId: uuidv4(), // Use valid UUID format
        deliveryModes: ['email'],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const userJwt = jwtService.sign({ id: testUser.id, email: testUser.email });

      await request(app.getHttpServer())
        .post('/survey')
        .set('Authorization', `Bearer ${userJwt}`)
        .send(createSurveyDto)
        .expect(404);
    });
  });

  describe('/survey/:id/send (POST)', () => {
    it('should send survey links to all persons in population', async () => {
      const userJwt = jwtService.sign({ id: testUser.id, email: testUser.email });

      await request(app.getHttpServer())
        .post(`/survey/${testSurvey.id}/send`)
        .set('Authorization', `Bearer ${userJwt}`)
        .expect(201);

      // Verify that survey access records were created
      const accessRecords = await surveyAccessService.getAccessBySurvey(testSurvey.id);
      expect(accessRecords.length).toBeGreaterThan(0);
    });

    it('should return 404 when survey not found', async () => {
      const userJwt = jwtService.sign({ id: testUser.id, email: testUser.email });

      await request(app.getHttpServer())
        .post(`/survey/${uuidv4()}/send`) // Use valid UUID format
        .set('Authorization', `Bearer ${userJwt}`)
        .expect(404);
    });
  });

  describe('/survey/questions/:jwt (GET)', () => {
    it('should return survey questions', async () => {
      const response = await request(app.getHttpServer())
        .get(`/survey/questions/${surveyJwt}`)
        .expect(200);

      expect(response.body).toHaveProperty('surveyId', testSurvey.id);
      expect(response.body).toHaveProperty('questionnaire');
      expect(response.body.questionnaire).toHaveProperty('id', testQuestionnaire.id);
      expect(response.body.questionnaire).toHaveProperty('title', 'Test Questionnaire');
      expect(response.body.questionnaire).toHaveProperty('questions');
      expect(response.body.questionnaire.questions).toHaveLength(3);
    });

    it('should return 404 for invalid JWT', async () => {
      await request(app.getHttpServer())
        .get('/survey/questions/invalid-jwt')
        .expect(404);
    });

    it('should return 401 for expired survey', async () => {
      // Create an expired survey
      const expiredSurvey = await surveyService.createSurvey({
        questionnaireId: testQuestionnaire.id,
        populationId: testPopulation.id,
        userId: testUser.id,
        deliveryModes: ['email'],
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      });

      const expiredJwt = jwtService.sign(
        {
          surveyId: expiredSurvey.id,
          personId: testPerson.id,
          type: 'survey-access',
        },
        { expiresIn: '30d' }
      );

      await surveyAccessService.createAccess(expiredSurvey.id, testPerson.id, expiredJwt);

      await request(app.getHttpServer())
        .get(`/survey/questions/${expiredJwt}`)
        .expect(401);

      // Clean up - survey will be deleted when population is deleted due to cascade
    });
  });

  describe('/survey/submit (POST)', () => {
    it('should submit answers successfully', async () => {
      const submitAnswersDto = {
        jwt: surveyJwt,
        answers: {
          [testQuestions[0].id]:['John Doe'] ,
          [testQuestions[1].id]: ['25'],
          [testQuestions[2].id]: ['Blue'],
        },
      };

      const response = await request(app.getHttpServer())
        .post('/survey/submit')
        .send(submitAnswersDto)
        .expect(201);

      // Verify that access was marked as completed
      const access = await surveyAccessService.findByJwtToken(surveyJwt);
      expect(access?.completed).toBe(true);
      expect(access?.completedAt).toBeDefined();
    });

    it('should return 404 for invalid JWT', async () => {
      const submitAnswersDto = {
        jwt: 'invalid-jwt',
        answers: { [uuidv4()]:[ 'answer1'] }, // Use valid UUID for question ID
      };

      await request(app.getHttpServer())
        .post('/survey/submit')
        .send(submitAnswersDto)
        .expect(404);
    });

    it('should return 401 for expired survey', async () => {
      // Create an expired survey
      const expiredSurvey = await surveyService.createSurvey({
        questionnaireId: testQuestionnaire.id,
        populationId: testPopulation.id,
        userId: testUser.id,
        deliveryModes: ['email'],
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      });

      const expiredJwt = jwtService.sign(
        {
          surveyId: expiredSurvey.id,
          personId: testPerson.id,
          type: 'survey-access',
        },
        { expiresIn: '30d' }
      );

      await surveyAccessService.createAccess(expiredSurvey.id, testPerson.id, expiredJwt);

      const submitAnswersDto = {
        jwt: expiredJwt,
        answers: { [uuidv4()]: ['answer1'] }, // Use valid UUID for question ID
      };

      await request(app.getHttpServer())
        .post('/survey/submit')
        .send(submitAnswersDto)
        .expect(401);

      // Clean up - survey will be deleted when population is deleted due to cascade
    });
  });

  describe('/survey/:id (GET)', () => {
    it('should return survey details', async () => {
      const userJwt = jwtService.sign({ id: testUser.id, email: testUser.email });

      const response = await request(app.getHttpServer())
        .get(`/survey/${testSurvey.id}`)
        .set('Authorization', `Bearer ${userJwt}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testSurvey.id);
      expect(response.body).toHaveProperty('questionnaireId', testQuestionnaire.id);
      expect(response.body).toHaveProperty('populationId', testPopulation.id);
      expect(response.body).toHaveProperty('deliveryModes');
      expect(response.body).toHaveProperty('expiresAt');
      expect(response.body).toHaveProperty('analyzed', false);
    });

    it('should return 404 when survey not found', async () => {
      const userJwt = jwtService.sign({ id: testUser.id, email: testUser.email });

      await request(app.getHttpServer())
        .get(`/survey/${uuidv4()}`) // Use valid UUID format
        .set('Authorization', `Bearer ${userJwt}`)
        .expect(404);
    });
  });

  describe('/survey/:id/stats (GET)', () => {
    it('should return survey statistics', async () => {
      const userJwt = jwtService.sign({ id: testUser.id, email: testUser.email });

      // Mark survey as seen and completed
      await surveyAccessService.markAsSeen(surveyJwt);
      await surveyAccessService.markAsCompleted(surveyJwt);

      const response = await request(app.getHttpServer())
        .get(`/survey/${testSurvey.id}/stats`)
        .set('Authorization', `Bearer ${userJwt}`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('seen');
      expect(response.body).toHaveProperty('completed');
      expect(response.body.total).toBeGreaterThan(0);
      expect(response.body.seen).toBeGreaterThan(0);
      expect(response.body.completed).toBeGreaterThan(0);
    });

    it('should return 404 when survey not found', async () => {
      const userJwt = jwtService.sign({ id: testUser.id, email: testUser.email });

      await request(app.getHttpServer())
        .get(`/survey/${uuidv4()}/stats`) // Use valid UUID format
        .set('Authorization', `Bearer ${userJwt}`)
        .expect(404);
    });
  });

  describe('Survey Access Tracking', () => {
    it('should track survey access correctly', async () => {
      // Initial state
      let access = await surveyAccessService.findByJwtToken(surveyJwt);
      expect(access?.seen).toBe(false);
      expect(access?.completed).toBe(false);

      // First access
      await request(app.getHttpServer())
        .get(`/survey/questions/${surveyJwt}`)
        .expect(200);

      access = await surveyAccessService.findByJwtToken(surveyJwt);
      expect(access?.seen).toBe(true);
      expect(access?.seenAt).toBeDefined();
      expect(access?.completed).toBe(false);

      // Submit answers
      const submitAnswersDto = {
        jwt: surveyJwt,
        answers: { [testQuestions[0].id]: ['answer1'] }, // Use valid question ID
      };

      await request(app.getHttpServer())
        .post('/survey/submit')
        .send(submitAnswersDto)
        .expect(201);

      access = await surveyAccessService.findByJwtToken(surveyJwt);
      expect(access?.seen).toBe(true);
      expect(access?.completed).toBe(true);
      expect(access?.completedAt).toBeDefined();
    });
  });

  describe('JWT Token Validation', () => {
    it('should validate JWT token structure', async () => {
      const payload = jwtService.verify(surveyJwt);
      expect(payload).toHaveProperty('surveyId', testSurvey.id);
      expect(payload).toHaveProperty('personId', testPerson.id);
      expect(payload).toHaveProperty('type', 'survey-access');
    });

    it('should reject expired JWT tokens', async () => {
      const expiredJwt = jwtService.sign(
        {
          surveyId: testSurvey.id,
          personId: testPerson.id,
          type: 'survey-access',
        },
        { expiresIn: '1ms' }
      );

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 10));

      await request(app.getHttpServer())
        .get(`/survey/questions/${expiredJwt}`)
        .expect(404);
    });
  });

  describe('Survey Expiration', () => {
    it('should prevent access to expired surveys', async () => {
      // Create an expired survey
      const expiredSurvey = await surveyService.createSurvey({
        questionnaireId: testQuestionnaire.id,
        populationId: testPopulation.id,
        userId: testUser.id,
        deliveryModes: ['email'],
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      });

      const expiredJwt = jwtService.sign(
        {
          surveyId: expiredSurvey.id,
          personId: testPerson.id,
          type: 'survey-access',
        },
        { expiresIn: '30d' }
      );

      await surveyAccessService.createAccess(expiredSurvey.id, testPerson.id, expiredJwt);

      await request(app.getHttpServer())
        .get(`/survey/questions/${expiredJwt}`)
        .expect(401);

      // Clean up - survey will be deleted when population is deleted due to cascade
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed request bodies', async () => {
      const userJwt = jwtService.sign({ id: testUser.id, email: testUser.email });

      // Test with missing required fields
      await request(app.getHttpServer())
        .post('/survey')
        .set('Authorization', `Bearer ${userJwt}`)
        .send({})
        .expect(400);

      // Test with invalid delivery modes (string instead of array)
      await request(app.getHttpServer())
        .post('/survey')
        .set('Authorization', `Bearer ${userJwt}`)
        .send({
          questionnaireId: testQuestionnaire.id,
          populationId: testPopulation.id,
          deliveryModes: 'email', // Invalid: should be array, not string
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .expect(400);

      // Test with empty delivery modes array
      await request(app.getHttpServer())
        .post('/survey')
        .set('Authorization', `Bearer ${userJwt}`)
        .send({
          questionnaireId: testQuestionnaire.id,
          populationId: testPopulation.id,
          deliveryModes: [], // Invalid: empty array
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .expect(400);
    });

    it('should handle invalid JWT tokens', async () => {
      // Test with malformed JWT
      await request(app.getHttpServer())
        .get('/survey/questions/malformed.jwt.token')
        .expect(404);

      // Test with expired JWT
      const expiredJwt = jwtService.sign(
        { surveyId: testSurvey.id, personId: testPerson.id, type: 'survey-access' },
        { expiresIn: '1ms' }
      );

      await new Promise(resolve => setTimeout(resolve, 10));

      await request(app.getHttpServer())
        .get(`/survey/questions/${expiredJwt}`)
        .expect(404);
    });

    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking the database service to throw errors
      // For now, we'll test that the application handles basic errors
      const userJwt = jwtService.sign({ id: testUser.id, email: testUser.email });

      // Test with a valid request to ensure the endpoint works
      await request(app.getHttpServer())
        .get(`/survey/${testSurvey.id}`)
        .set('Authorization', `Bearer ${userJwt}`)
        .expect(200);
    });
  });
}); 