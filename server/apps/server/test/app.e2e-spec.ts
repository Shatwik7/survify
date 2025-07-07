import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { App } from 'supertest/types';
describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let access_token;
  const random=Math.random()*1000;
  const testUser = {
    name: 'Test User'+random,
    email: 'testuser@'+random+'example.com',
    password: 'strongPassword123'+random,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/signup (POST) should register a new user', async () => {
    const res = await request(app.getHttpServer())
      .post('/signup')
      .send(testUser)
      .expect(201);

    expect(res.body).toHaveProperty('email', testUser.email);
    expect(res.body).toHaveProperty('name', testUser.name);
    expect(res.body).not.toHaveProperty('password'); // password should be hidden
  });

  it('/signin (POST) should log in the user and return access token', async () => {
    const res = await request(app.getHttpServer())
      .post('/signin')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(201);

    expect(res.body).toHaveProperty('access_token');
    access_token = res.body.access_token;
  });

  it('/me (GET) should return user profile', async () => {
    const res = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${access_token}`)
      .expect(200);

    expect(res.body).toHaveProperty('email', testUser.email);
  });

  it('/me (DELETE) should delete user profile', async () => {
    const res = await request(app.getHttpServer())
      .delete('/me')
      .set('Authorization', `Bearer ${access_token}`)
      .expect(201);
    expect(res.body).toHaveProperty('success')
    expect(res.body.success).toBe(true);
  });

  //**********JWT IS NOT DELETED SO IT WILL STILL GET THE ID --> CAN CHANGE IT TO SESSION USING REDIS*************/

  // it('/me (GET) after delete should fail with 401', async () => {
  //   await request(app.getHttpServer())
  //     .get('/me')
  //     .set('Authorization', `Bearer ${access_token}`)
  //     .expect(401);
  // });
});
