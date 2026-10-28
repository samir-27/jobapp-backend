import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController & Security Policy (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/ (GET) - Public root endpoint', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('GET /users - Rejects anonymous request with 401 (SEC-001 default-deny)', () => {
    return request(app.getHttpServer())
      .get('/users')
      .expect(401);
  });

  it('GET /companies - Public company list allowed', () => {
    return request(app.getHttpServer())
      .get('/companies')
      .expect(200);
  });

  it('GET /jobs - Public job list allowed', () => {
    return request(app.getHttpServer())
      .get('/jobs')
      .expect(200);
  });

  it('POST /jobs - Rejects anonymous job creation with 401', () => {
    return request(app.getHttpServer())
      .post('/jobs')
      .send({ title: 'Test Job' })
      .expect(401);
  });

  it('POST /applyjob/create - Rejects anonymous application with 401', () => {
    return request(app.getHttpServer())
      .post('/applyjob/create')
      .send({ jobId: '507f1f77bcf86cd799439011' })
      .expect(401);
  });
});
