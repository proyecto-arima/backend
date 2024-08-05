import { StatusCodes } from 'http-status-codes';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

import { connectToMongoDB, disconnectFromMongoDB } from '@/common/utils/mongodb';
import { app } from '@/server';

describe('Generic teacher tests', () => {
  beforeAll(async () => {
    const mongod = await MongoMemoryServer.create();
    await connectToMongoDB(mongod.getUri());
  });

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.db.collection('courses').insertMany([
      {
        title: 'Course 1',
        description: 'Course for the test teacher',
        image: 'https://example.com/image1.jpg',
        teacherUserId: '6643eb8662e9b625cd5dda4f', // ID del docente que ejecuta la prueba
      },
      {
        title: 'Course 2',
        description: 'Course for another teacher',
        image: 'https://example.com/image2.jpg',
        teacherUserId: '6643eb8662e9b625cd5dda4g', // ID de otro docente
      },
    ]);

    await mongoose.connection.db.collection('users').insertOne({
      _id: new mongoose.Types.ObjectId('6643eb8662e9b625cd5dda4f'),
      firstName: 'Teacher',
      lastName: 'Proyecto Arima',
      document: {
        type: 'GENERIC',
        number: '00000000',
      },
      email: 'teacher@proyectoarima.tech',
      password: '$2b$10$6aJ.eouEbOlyhV99pVsrM./mAdk41tzPh6tZLv1vyFaWqB6G/5Zf.', // admin
      role: 'TEACHER',
      forcePasswordReset: false,
    });
  });

  const login = async (email = 'teacher@proyectoarima.tech', password = 'admin') => {
    const response = await request(app).post('/auth').send({
      email,
      password,
    });
    const result = response.body;
    return result.data?.['access_token'];
  };

  it('GET /me/courses', async () => {
    const token = await login();

    const response = await request(app).get('/teachers/me/courses').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.OK);
    const result = response.body;
    console.log(result);
    expect(result.success).toBe(true);
    const courses = result.data;
    expect(courses).toHaveLength(1);
    expect(courses[0]).toHaveProperty('title', 'Course 1');
  });

  afterAll(async () => {
    await disconnectFromMongoDB();
  });
});
