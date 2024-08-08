import { StatusCodes } from 'http-status-codes';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

import { connectToMongoDB, disconnectFromMongoDB } from '@/common/utils/mongodb';
import { app } from '@/server';

describe('Generic student tests', () => {
  beforeAll(async () => {
    const mongod = await MongoMemoryServer.create();
    await connectToMongoDB(mongod.getUri());
  });

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.db.collection('courses').insertMany([
      {
        title: 'Course 1',
        description: 'Course for the test student',
        image: 'https://example.com/image1.jpg',
        teacherUserId: 'teacher1',
        students: {
          userId: '6643eb8662e9b625cd5dda4f',
          firstName: 'christian',
          lastName: 'harper',
        },
      },
      {
        title: 'Course 2',
        description: 'Course for another student',
        image: 'https://example.com/image2.jpg',
        teacherUserId: 'teacher2',
        students: {
          userId: '6643eb8662e9b625cd5dda4a',
          firstName: 'Alex',
          lastName: 'Volkov',
        },
      },
    ]);

    await mongoose.connection.db.collection('users').insertOne({
      _id: new mongoose.Types.ObjectId('6643eb8662e9b625cd5dda4f'),
      firstName: 'Student',
      lastName: 'Proyecto Arima',
      document: {
        type: 'GENERIC',
        number: '00000000',
      },
      email: 'student@proyectoarima.tech',
      password: '$2b$10$6aJ.eouEbOlyhV99pVsrM./mAdk41tzPh6tZLv1vyFaWqB6G/5Zf.', // admin
      role: 'STUDENT',
      forcePasswordReset: false,
    });

    await mongoose.connection.db.collection('students').insertOne({
      _id: new mongoose.Types.ObjectId('6643eb8662e9b625cd5dda3c'),
      userId: '6643eb8662e9b625cd5dda4f',
      firstName: 'christian',
      lastName: 'harper',
      learningProfile: 'VISUAL',
    });
  });

  const login = async (email = 'student@proyectoarima.tech', password = 'admin') => {
    const response = await request(app).post('/auth').send({
      email,
      password,
    });
    const result = response.body;
    return result.data?.['access_token'];
  };

  it('GET /students/me/courses', async () => {
    const token = await login();

    const response = await request(app).get('/students/me/courses').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.OK);
    const result = response.body;
    expect(result.success).toBe(true);
    const courses = result.data;
    expect(courses).toHaveLength(1);
    expect(courses[0]).toHaveProperty('title', 'Course 1');
  });

  it('GET /students/', async () => {
    const token = await login();

    const response = await request(app).get('/students/').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.OK);
    const result = response.body;
    expect(result.success).toBe(true);
    const students = result.data;
    expect(students).toHaveLength(1);
    expect(students[0]).toHaveProperty('firstName', 'Student');
  });

  //TODO: VER ESTE TEST, FALLA EL ENVIO DE MAIL EN EL TEST
  /* 
  it('POST /students/', async () => {
    const studentData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      document: {
        type: 'DNI',
        number: '123456789',
      }
    };

    const response = await request(app).post('/students/').send(studentData);

    expect(response.status).toBe(StatusCodes.CREATED);
    const result = response.body;
    expect(result.success).toBeTruthy();
    expect(result.data).toHaveProperty('id');
  });*/

  it('GET /students/:id/learning-profile', async () => {
    const token = await login();

    const studentId = '6643eb8662e9b625cd5dda3c';

    const response = await request(app)
      .get(`/students/${studentId}/learning-profile`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.OK);
    const result = response.body;
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('learningProfile', 'VISUAL');
  });

  afterAll(async () => {
    await disconnectFromMongoDB();
  });
});
