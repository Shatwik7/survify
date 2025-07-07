import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('QuestionnaireController (e2e)', () => {
  let app: INestApplication;
  let access_token: string;
  let userId: string;
  let createdQuestionnaireId: string;

  const random = Math.floor(Math.random() * 100000);
  const testUser = {
    name: 'Test User' + random,
    email: `testuser${random}@example.com`,
    password: 'strongPassword123',
  };

  const questionnaireData = {
    title: 'Test Questionnaire',
    description: 'A test questionnaire',
    status: 'draft',
  };

  const question = {
    description : 'What is 2 + 2?',
    type:"number",
    options: ['1', '2', '3', '4'],
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post('/signup')
      .send(testUser)
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/signin')
      .send({ email: testUser.email, password: testUser.password })
      .expect(201);

    access_token = res.body.access_token;
  });

  it('/questionnaire (POST) should create a questionnaire', async () => {
    const res = await request(app.getHttpServer())
      .post('/questionnaire')
      .set('Authorization', `Bearer ${access_token}`)
      .send(questionnaireData)
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe(questionnaireData.title);
    createdQuestionnaireId = res.body.id;
  });

  it('/questionnaire (GET) should return all user questionnaires', async () => {
    const res = await request(app.getHttpServer())
      .get('/questionnaire')
      .set('Authorization', `Bearer ${access_token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('title');
  });


  it('/questionnaire/:id (GET) should return a questionnaire', async () => {
    const res = await request(app.getHttpServer())
      .get(`/questionnaire/${createdQuestionnaireId}`)
      .set('Authorization', `Bearer ${access_token}`)
      .expect(200);

    expect(res.body).toHaveProperty('title', questionnaireData.title);
  });

  it('/questionnaire/:id/question (POST) should add a question', async () => {
    const res = await request(app.getHttpServer())
      .post(`/questionnaire/${createdQuestionnaireId}/question`)
      .set('Authorization', `Bearer ${access_token}`)
      .send(question)
      .expect(201);

    expect(res.body).toHaveProperty('description');
  });

    it('/questionnaire/:id/question (POST) should add a question', async () => {
    const res = await request(app.getHttpServer())
      .post(`/questionnaire/${createdQuestionnaireId}/question`)
      .set('Authorization', `Bearer ${access_token}`)
      .send(question)
      .expect(201);

    expect(res.body).toHaveProperty('description');
  });


  it('/questionnaire/:id (DELETE) should delete questionnaire', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/questionnaire/${createdQuestionnaireId}`)
      .set('Authorization', `Bearer ${access_token}`)
      .expect(200);

    expect(res.body).toHaveProperty('success', true);
  });

  afterAll(async () => {
    await request(app.getHttpServer())
      .delete(`/me`)
      .set('Authorization', `Bearer ${access_token}`)
      .expect(201);
    await app.close();
  });
});
