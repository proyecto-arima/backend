import { StatusCodes } from 'http-status-codes';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

import { ServiceResponse } from '@/common/models/serviceResponse';
import { connectToMongoDB, disconnectFromMongoDB } from '@/common/utils/mongodb';
import { app } from '@/server';

describe('Authentication tests', () => {
  beforeAll(async () => {
    const mongod = await MongoMemoryServer.create();
    await connectToMongoDB(mongod.getUri());
  });

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.db.collection('users').insertOne({
      firstName: 'Admin',
      lastName: 'Proyecto Arima',
      document: {
        type: 'GENERIC',
        number: '00000000',
      },
      email: 'admin@proyectoarima.tech',
      password: '$2b$10$6aJ.eouEbOlyhV99pVsrM./mAdk41tzPh6tZLv1vyFaWqB6G/5Zf.', // admin
      role: 'ADMIN',
      forcePasswordReset: true,
    });
  });

  const loginAsAdminShouldSuccess = async (email = 'admin@proyectoarima.tech', password = 'admin') => {
    const response = await request(app).post('/auth/login').send({
      email,
      password,
    });
    const result: ServiceResponse = response.body;
    expect(response.statusCode).toEqual(StatusCodes.OK);
    expect(result.success).toBeTruthy();
    expect(result.responseObject).toHaveProperty('access_token');
    expect(result.message).toEqual('User logged in');
    expect(response.header).toHaveProperty('set-cookie');
    expect(response.header['set-cookie'][0]).toMatch(/access_token=.+; Max-Age=\d+; Path=\/; Expires=.+; HttpOnly/);

    return result.responseObject?.['access_token'];
  };

  const loginAsAdminShouldFail = async (email: string, password: string) => {
    const response = await request(app).post('/auth/login').send({
      email,
      password,
    });

    const result: ServiceResponse = response.body;

    expect(response.statusCode).toEqual(StatusCodes.UNAUTHORIZED);
    expect(result.success).toBeFalsy();
    expect(result.message).toEqual('Invalid credentials');
    expect(result.responseObject).toBeNull();
    expect(response.header).not.toHaveProperty('set-cookie');
  };

  it('POST /auth/login', async () => {
    await loginAsAdminShouldSuccess();
  });

  it('POST /auth/login with invalid email', async () => {
    loginAsAdminShouldFail('admin2@proyectoarima.tech', 'admin');
  });

  it('POST /auth/login with invalid password', async () => {
    loginAsAdminShouldFail('admin@proyectoarima.tech', 'admin2');
  });

  it('POST /auth/reset', async () => {
    const accessToken = await loginAsAdminShouldSuccess();

    const response = await request(app).post('/auth/reset').set('Authorization', `Bearer ${accessToken}`).send({
      oldPassword: 'admin',
      newPassword: 'admin2',
      newPasswordConfirmation: 'admin2',
    });

    const result: ServiceResponse = response.body;
    expect(response.statusCode).toEqual(StatusCodes.OK);
    expect(result.success).toBeTruthy();
    expect(result.message).toEqual('Password reset');
    expect(result.responseObject).toBeNull();

    await loginAsAdminShouldFail('admin@proyectoarima.tech', 'admin');
    await loginAsAdminShouldSuccess('admin@proyectoarima.tech', 'admin2');
  });

  it('POST /auth/logout', async () => {
    const accessToken = await loginAsAdminShouldSuccess();

    const response = await request(app).post('/auth/logout').set('Cookie', `access_token=${accessToken}`);

    expect(response.statusCode).toEqual(StatusCodes.OK);
    expect(response.header).not.toHaveProperty('Set-Cookie');
  });

  afterAll(async () => {
    await disconnectFromMongoDB();
  });
});