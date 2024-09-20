import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import { connectToMongoDB, disconnectFromMongoDB } from '@/common/utils/mongodb';

let mongod: MongoMemoryServer;

export const setupTestEnvironment = () => {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await connectToMongoDB(mongod.getUri());
  });

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    await insertInitialData();
  });

  afterAll(async () => {
    await disconnectFromMongoDB();
    await mongod.stop();
  });
};

const insertInitialData = async () => {
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
          image: 'https://example.com/image.jpg',
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
          email: 'alex@proyectoarima.tech',
        },
      ],
    },
    {
      title: 'Course 3',
      description: 'Course for the test teacher',
      image: 'https://example.com/image1.jpg',
      teacherUserId: new mongoose.Types.ObjectId('6643eb8662e9b625cd5dda4c'), // ID del docente que ejecuta la prueba
    },
  ]);

  await mongoose.connection.db.collection('users').insertMany([
    {
      _id: new mongoose.Types.ObjectId('6643eb8662e9b625cd5dda4f'),
      firstName: 'Student',
      lastName: '1',
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
    {
      _id: new mongoose.Types.ObjectId('6643eb8662e9b625cd5dda00'),
      firstName: 'Director',
      lastName: 'Proyecto Arima',
      document: {
        type: 'GENERIC',
        number: '00000000',
      },
      email: 'director@proyectoarima.tech',
      password: '$2b$10$6aJ.eouEbOlyhV99pVsrM./mAdk41tzPh6tZLv1vyFaWqB6G/5Zf.', // admin
      role: 'DIRECTOR',
      forcePasswordReset: false,
    },
    {
      _id: new mongoose.Types.ObjectId('6643eb8662e9b625cd5dda4c'),
      firstName: 'Specific',
      lastName: 'Teacher',
      document: {
        type: 'GENERIC',
        number: '00000000',
      },
      email: 'specific@proyectoarima.tech',
      password: '$2b$10$6aJ.eouEbOlyhV99pVsrM./mAdk41tzPh6tZLv1vyFaWqB6G/5Zf.', // admin
      role: 'TEACHER',
      forcePasswordReset: false,
    },
  ]);

  await mongoose.connection.db.collection('students').insertMany([
    {
      _id: new mongoose.Types.ObjectId('6643eb8662e9b625cd5dda3c'),
      user: new mongoose.Types.ObjectId('6643eb8662e9b625cd5dda4f'),
      institute: new mongoose.Types.ObjectId('66b8e029d9b6b3b37200bde3'),
      firstName: 'Student',
      lastName: '1',
      learningProfile: 'CONVERGENTE',
      courses: [
        {
          id: '66b2ba4bb24f72c9f4aac1d5',
          courseName: 'Course 1',
        },
      ],
    },
    {
      _id: new mongoose.Types.ObjectId('6643eb8662e9b625cd5dda2b'),
      user: new mongoose.Types.ObjectId('6643eb8662e9b625cd5ddb1b'),
      institute: new mongoose.Types.ObjectId('66b8e029d9b6b3b37200bde3'),
      firstName: 'stella',
      lastName: 'mendez',
      learningProfile: 'CONVERGENTE',
    },
  ]);

  await mongoose.connection.db.collection('sections').insertOne({
    _id: new mongoose.Types.ObjectId('66b0e07bceed604f8977c1cc'),
    name: 'Aprendiendo mas',
    description: 'dale que vos podes, entra a mi seccion.',
    visible: true,
    image: 'https://example.com/image.jpg',
    contents: [
      {
        id: new mongoose.Types.ObjectId('66b0e07bceed604f8977c0aa'),
        title: 'CSharp bla',
      },
    ],
  });

  await mongoose.connection.db.collection('contents').insertOne({
    _id: new mongoose.Types.ObjectId('66b0e07bceed604f8977c0aa'),
    key: 'fe6728c5-3919-462f-8f67-ad899edbe5fb',
    sectionId: new mongoose.Types.ObjectId('66b0e07bceed604f8977c1cc'),
    title: 'CSharp bla',
    publicationType: 'AUTOMATIC',
    visible: true,
    reactions: [
      {
        userId: new mongoose.Types.ObjectId('6643eb8662e9b625cd5ddb1b'),
        isSatisfied: true,
      },
    ],
    generated: [
      {
        type: 'SUMMARY',
        content: 'google.com',
        approved: false,
      },
      {
        type: 'MIND_MAP',
        content: 'google.com',
        approved: false,
      },
      {
        type: 'GAMIFICATION',
        content: 'google.com',
        approved: false,
      },
      {
        type: 'SPEECH',
        content: 'google.com',
        approved: false,
      },
    ],
    publicationDate: '2024-08-01T00:00:00Z',
  });

  await mongoose.connection.db.collection('institutes').insertOne({
    _id: new mongoose.Types.ObjectId('66b8e029d9b6b3b37200bde3'),
    name: 'Test Institute',
  });

  await mongoose.connection.db.collection('directors').insertOne({
    _id: new mongoose.Types.ObjectId('6643eb8662e9b625cd5dda10'),
    user: new mongoose.Types.ObjectId('6643eb8662e9b625cd5dda00'),
    institute: new mongoose.Types.ObjectId('66b8e029d9b6b3b37200bde3'),
  });
};
