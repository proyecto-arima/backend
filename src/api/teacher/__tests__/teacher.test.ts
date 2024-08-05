import { StatusCodes } from 'http-status-codes';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

import { generateTeacherToken } from '@/common/utils/generateToken';
import { connectToMongoDB, disconnectFromMongoDB } from '@/common/utils/mongodb';
import { app } from '@/server';

describe('Generic teacher tests', () => {
  let teacherToken: string;

  beforeAll(async () => {
    teacherToken = generateTeacherToken();

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
        teacherId: 'teacher1', // ID del docente que ejecuta la prueba
      },
      {
        title: 'Course 2',
        description: 'Course for another teacher',
        image: 'https://example.com/image2.jpg',
        teacherId: 'teacher2', // ID de otro docente
      },
    ]);
  });

  const ShouldReturnOnlyCoursesForTheAuthenticatedTeacher = async () => {
    const response = await request(app).get('/me/courses').set('Authorization', `Bearer ${teacherToken}`);

    console.log(response.body);

    expect(response.status).toBe(StatusCodes.OK);
    const result = response.body;
    expect(result.success).toBe(true);
    const courses = result.data;
    expect(courses).toHaveLength(1);
    expect(courses[0]).toHaveProperty('title', 'Course 1');
  };

  it.skip('GET /me/courses', async () => {
    await ShouldReturnOnlyCoursesForTheAuthenticatedTeacher();
  });

  afterAll(async () => {
    await disconnectFromMongoDB();
  });
});
