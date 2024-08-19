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
        teacherUserId: '6643eb8662e9b625cd5dda11',
        students: [
          {
            userId: '6643eb8662e9b625cd5dda4f',
            firstName: 'student',
            lastName: '1',
            email: 'student@proyectoarima.tech',
          },
        ],
        sections: [
          {
            id: '66b0e07bceed604f8977c1cc',
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
        teacherUserId: '6643eb8662e9b625cd5dda11',
        students: [
          {
            userId: '6643eb8662e9b625cd5dda4a',
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
        userId: '6643eb8662e9b625cd5dda4f',
        firstName: 'christian',
        lastName: 'harper',
        learningProfile: 'VISUAL',
      },

      {
        _id: new mongoose.Types.ObjectId('6643eb8662e9b625cd5dda2b'),
        userId: '6643eb8662e9b625cd5ddb1b',
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
          id: '66b0e1f3f4bf663c33986f2d',
          title: 'Advanced TypeScript Techniques',
        },
      ],
    });

    await mongoose.connection.db.collection('contents').insertOne({
      _id: new mongoose.Types.ObjectId('66b0e07bceed604f8977c0aa'),
      key: 'fe6728c5-3919-462f-8f67-ad899edbe5fb',
      sectionId: '66b0e07bceed604f8977c1cc',
      title: 'CSharp bla',
      publicationType: 'DEFERRED',
      reactions: [
        {
          idStudent: '6643eb8662e9b625cd5ddb1b',
          isSatisfied: true,
        },
      ],
      publicationDate: '2024-08-01T00:00:00Z',
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

  it('POST /contents/:id/reactions', async () => {
    const token = await login();

    const contentId = '66b0e07bceed604f8977c0aa';

    const reactionData = {
      isSatisfied: true,
    };

    const response = await request(app)
      .post(`/contents/${contentId}/reactions`)
      .send(reactionData)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.OK);
    const result = response.body;
    expect(result.success).toBe(true);
    const reactions = result.data.reactions;
    expect(reactions).toHaveLength(2);
  });

  it('GET /contents/:id/reactions', async () => {
    const token = await login();

    const contentId = '66b0e07bceed604f8977c0aa';

    const response = await request(app).get(`/contents/${contentId}/reactions`).set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.OK);
    const result = response.body;
    expect(result.success).toBe(true);
    const reactions = result.data.reactions;
    expect(reactions).toHaveLength(1);
    expect(reactions[0]).toHaveProperty('idStudent', '6643eb8662e9b625cd5ddb1b');
  });

  afterAll(async () => {
    await disconnectFromMongoDB();
  });
});
