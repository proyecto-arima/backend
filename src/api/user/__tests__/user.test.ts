import { StatusCodes } from 'http-status-codes';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

import { ApiResponse } from '@/common/models/apiResponse';
import { connectToMongoDB, disconnectFromMongoDB } from '@/common/utils/mongodb';
import { app } from '@/server';

describe('Generic user tests', () => {
  beforeAll(async () => {
    const mongod = await MongoMemoryServer.create();
    await connectToMongoDB(mongod.getUri());
  });

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.db.collection('users').insertMany([
      {
        firstName: 'test1',
        lastName: 'user',
        document: {
          type: 'GENERIC',
          number: '00000001',
        },
        email: 'test.user.1@proyectoarima.tech',
        password: 'nCErKOmoNsCOUsnElEscIntONSinvE',
        role: 'STUDENT',
        forcePasswordReset: false,
      },
      {
        firstName: 'test2',
        lastName: 'user',
        document: {
          type: 'GENERIC',
          number: '00000002',
        },
        email: 'test.user.1@proyectoarima.tech',
        password: 'bLEhEvenSIONaLanDaUDSHIerIBErs',
        role: 'TEACHER',
        forcePasswordReset: false,
      },
    ]);
  });

  const ShouldGetAllTypeOfUsers = async () => {
    const response = await request(app).get('/users');
    const result: ApiResponse = response.body;

    // TODO: Status code must be 200. NEEDS TO FIX
    expect(response.statusCode).toEqual(StatusCodes.OK);
    // expect(result.success).toBeTruthy();
    // expect(result.message).toEqual('Users retrieved successfully');
    // expect(result.data).toHaveProperty('users');
    // expect(result.data).property('users').greaterThanOrEqual(2);
    return result.data?.['statusCode'];
  };

  it.skip('GET /users', async () => {
    await ShouldGetAllTypeOfUsers();
  });

  it.skip('GET /users/:id', async () => {});

  afterAll(async () => {
    await disconnectFromMongoDB();
  });
});
