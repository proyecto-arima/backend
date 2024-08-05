import { StatusCodes } from 'http-status-codes';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

import { generateStudentToken } from '@/common/utils/generateToken';
import { connectToMongoDB, disconnectFromMongoDB } from '@/common/utils/mongodb';
import { app } from '@/server';

describe('Generic student tests', () => {
  let studentToken: string;

  beforeAll(async () => {
    studentToken = generateStudentToken();

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
        teacherId: 'teacher1',
        students: {
          userId: 'student1',
          firstName: 'christian',
          lastName: 'harper',
        },
      },
      {
        title: 'Course 2',
        description: 'Course for another student',
        image: 'https://example.com/image2.jpg',
        teacherId: 'teacher2',
        students: {
          userId: 'student2',
          firstName: 'Alex',
          lastName: 'Volkov',
        },
      },
    ]);
  });

  /*
  it('should create a student', async () => {
    const studentData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'securepassword',
      role: 'STUDENT',
      // other required fields
    };

    const response = await request(app).post('/students').send(studentData);

    expect(response.status).toBe(StatusCodes.CREATED);
    const result: ApiResponse = response.body;
    expect(result.success).toBeTruthy();
    expect(result.data).toHaveProperty('id');
  });*/

  const ShouldReturnOnlyCoursesForTheAuthenticatedStudent = async () => {
    const response = await request(app).get('/me/courses').set('Authorization', `Bearer ${studentToken}`);

    expect(response.status).toBe(StatusCodes.OK);
    const courses = response.body;
    expect(courses).toHaveLength(1);
    expect(courses[0]).toHaveProperty('title', 'Course 1');
  };

  it.skip('GET /me/courses', async () => {
    await ShouldReturnOnlyCoursesForTheAuthenticatedStudent();
  });

  /*
  it('should get student learning profile', async () => {
    const studentId = 'someStudentId';

    const response = await request(app)
      .get(`/students/${studentId}/learning-profile`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(response.status).toBe(StatusCodes.OK);
    const result: ApiResponse = response.body;
    expect(result.success).toBeTruthy();
    expect(result.data).toHaveProperty('learningProfile');
  });*/

  afterAll(async () => {
    await disconnectFromMongoDB();
  });
});
