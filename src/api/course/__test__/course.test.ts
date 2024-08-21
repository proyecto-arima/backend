import { StatusCodes } from 'http-status-codes';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

import { connectToMongoDB, disconnectFromMongoDB } from '@/common/utils/mongodb';
import { app } from '@/server';

describe('Generic course tests', () => {
  beforeAll(async () => {
    const mongod = await MongoMemoryServer.create();
    await connectToMongoDB(mongod.getUri());
  });

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.db.collection('courses').insertMany([
      {
        _id: new mongoose.Types.ObjectId('66b2ba4bb24f72c9f4aac1d5'),
        title: 'Course 1',
        description: 'Course for the test student',
        image: 'https://example.com/image1.jpg',
        teacherUserId: new mongoose.Types.ObjectId('6643eb8662e9b625cd5dda11'),
        students: [
          {
            userId: new mongoose.Types.ObjectId('6643eb8662e9b625cd5dda4f'),
            firstName: 'student',
            lastName: '1',
            email: 'student@proyectoarima.tech',
          },
        ],
        sections: [
          {
            id: new mongoose.Types.ObjectId('66b0e07bceed604f8977c1cc'),
            name: 'Aprendiendo mas',
            description: 'dale que vos podes, entra a mi seccion.',
          },
        ],
      },
      {
        _id: new mongoose.Types.ObjectId('66b2ba4bb24f72c9f4aac1d4'),
        title: 'Course 2',
        description: 'Course for another student',
        image: 'https://example.com/image2.jpg',
        teacherUserId: new mongoose.Types.ObjectId('6643eb8662e9b625cd5dda11'),
        students: [
          {
            userId: new mongoose.Types.ObjectId('6643eb8662e9b625cd5dda4a'),
            firstName: 'Alex',
            lastName: 'Volkov',
            email: 'alexV@proyectoarima.tech',
          },
        ],
      },
    ]);

    await mongoose.connection.db.collection('users').insertMany([
      {
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
      },
      {
        _id: new mongoose.Types.ObjectId('6643eb8662e9b625cd5ddb1b'),
        firstName: 'stella',
        lastName: 'mendez',
        document: {
          type: 'GENERIC',
          number: '00000000',
        },
        email: 'stella@proyectoarima.tech',
        password: '$2b$10$6aJ.eouEbOlyhV99pVsrM./mAdk41tzPh6tZLv1vyFaWqB6G/5Zf.', // admin
        role: 'STUDENT',
        forcePasswordReset: false,
      },
      {
        _id: new mongoose.Types.ObjectId('6643eb8662e9b625cd5dda11'),
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
      },
    ]);

    await mongoose.connection.db.collection('students').insertMany([
      {
        _id: new mongoose.Types.ObjectId('6643eb8662e9b625cd5dda3c'),
        userId: new mongoose.Types.ObjectId('6643eb8662e9b625cd5dda4f'),
        firstName: 'christian',
        lastName: 'harper',
        learningProfile: 'VISUAL',
      },

      {
        _id: new mongoose.Types.ObjectId('6643eb8662e9b625cd5dda2b'),
        userId: new mongoose.Types.ObjectId('6643eb8662e9b625cd5ddb1b'),
        firstName: 'stella',
        lastName: 'mendez',
        learningProfile: 'VISUAL',
      },
    ]);

    await mongoose.connection.db.collection('sections').insertOne({
      _id: new mongoose.Types.ObjectId('66b0e07bceed604f8977c1cc'),
      name: 'Aprendiendo mas',
      description: 'dale que vos podes, entra a mi seccion.',
      visible: true,
      contents: [
        {
          id: new mongoose.Types.ObjectId('66b0e1f3f4bf663c33986f2d'),
          title: 'Advanced TypeScript Techniques',
        },
      ],
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

  it('POST /courses/', async () => {
    const token = await login();

    const courseData = {
      title: 'CURSO 3',
      description: 'CURSO 3.',
      image: 'https://example.com/image.jpg',
      studentEmails: ['teacher@proyectoarima.tech'],
    };

    const response = await request(app).post('/courses/').send(courseData).set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.CREATED);
    const result = response.body;
    expect(result.success).toBeTruthy();
    expect(result.data).toHaveProperty('id');
  });

  it('POST /courses/:id/section', async () => {
    const token = await login();

    const courseId = '66b2ba4bb24f72c9f4aac1d5';

    const sectionData = {
      name: 'profundizando conceptos',
      description: 'aprenderemos mas sobre ts',
      visible: true,
    };

    const response = await request(app)
      .post(`/courses/${courseId}/section`)
      .send(sectionData)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.OK);
    const result = response.body;
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('id');
  });

  it('POST /courses/:id/students', async () => {
    const token = await login();

    const courseId = '66b2ba4bb24f72c9f4aac1d5';

    const studentsData = {
      studentEmails: ['stella@proyectoarima.tech'],
    };

    const response = await request(app)
      .post(`/courses/${courseId}/students`)
      .send(studentsData)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.OK);
    const result = response.body;
    expect(result.success).toBe(true);
    const students = result.data.students;
    expect(students).toHaveLength(2);
  });

  it('GET /courses/:id', async () => {
    const token = await login();

    const courseId = '66b2ba4bb24f72c9f4aac1d5';

    const response = await request(app).get(`/courses/${courseId}`).set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.OK);
    const result = response.body;
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('title', 'Course 1');
  });

  it('GET /courses/:id/sections', async () => {
    const token = await login();

    const courseId = '66b2ba4bb24f72c9f4aac1d5';

    const response = await request(app).get(`/courses/${courseId}/sections`).set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.OK);
    const result = response.body;
    expect(result.success).toBe(true);
    const sections = result.data;
    expect(sections).toHaveLength(1);
    expect(sections[0]).toHaveProperty('name', 'Aprendiendo mas');
  });

  it('GET /courses/:id/students', async () => {
    const token = await login();

    const courseId = '66b2ba4bb24f72c9f4aac1d5';

    const response = await request(app).get(`/courses/${courseId}/students`).set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.OK);
    const result = response.body;
    expect(result.success).toBe(true);
    const students = result.data;
    expect(students).toHaveLength(1);
    expect(students[0]).toHaveProperty('firstName', 'Student');
  });

  /*
  it('DELETE /courses/:courseId', async () => {
    const token = await login();

    const courseId = '66b2ba4bb24f72c9f4aac1d5';

    const response = await request(app).delete(`/courses/${courseId}`).set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.OK);
    const result = response.body;
    expect(result.success).toBe(true);
    expect(result.message).toBe('Course deleted successfully');
  });*/

  afterAll(async () => {
    await disconnectFromMongoDB();
  });
});
