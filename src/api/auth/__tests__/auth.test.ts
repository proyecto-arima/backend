import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

import { ApiResponse } from '@/common/models/apiResponse';
import { connectToMongoDB, disconnectFromMongoDB } from '@/common/utils/mongodb';
import { app } from '@/server';

vi.mock('@/common/mailSender/mailSenderService', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/common/mailSender/mailSenderService')>();
  return {
    ...mod,
    buildTransporter: vi.fn(),
    sendMailTo: vi.fn(),
  };
});

vi.mock('jsonwebtoken', async (importOriginal) => {
  const mod = await importOriginal<typeof import('jsonwebtoken')>();
  return {
    ...mod,
    verify: vi.fn().mockReturnValue(true),
    sign: vi.fn().mockReturnValue('testToken'),
  };
});

describe('Authentication tests', () => {
  const testUsername = 'admin@proyectoarima.tech';
  const testPassword = 'admin';
  const testToken = 'testToken';

  beforeAll(async () => {
    const mongod = await MongoMemoryServer.create();
    await connectToMongoDB(mongod.getUri());
  });

  beforeEach(async () => {
    const testingUser = {
      firstName: 'Admin',
      lastName: 'Proyecto Arima',
      document: {
        type: 'GENERIC',
        number: '00000000',
      },
      email: testUsername,
      password: await bcrypt.hash(testPassword, 10),
      role: 'ADMIN',
      forcePasswordReset: false, // User already set their password
    };

    await mongoose.connection.dropDatabase();
    await mongoose.connection.db.collection('users').insertOne(testingUser);
  });

  const loginAsAdminShouldSuccess = async (email = testUsername, password = 'admin') => {
    const response = await request(app).post('/auth').send({
      email,
      password,
    });
    const result: ApiResponse = response.body;

    expect(response.statusCode).toEqual(StatusCodes.OK);
    expect(result.success).toBeTruthy();
    expect(result.data).toHaveProperty('access_token');
    expect(response.header).toHaveProperty('set-cookie');
    expect(response.header['set-cookie'][0]).toMatch(/access_token=.+; Max-Age=\d+; Path=\/; Expires=.+; HttpOnly/);
    return result.data?.['access_token'];
  };

  const loginAsAdminShouldFail = async (email: string, password: string) => {
    const response = await request(app).post('/auth').send({
      email,
      password,
    });

    const result: ApiResponse = response.body;

    expect(response.statusCode).toEqual(StatusCodes.UNAUTHORIZED);
    expect(result.success).toBeFalsy();
    expect(result.message).toEqual('Invalid credentials');
    expect(result.data).toBeNull();
    expect(response.header).not.toHaveProperty('set-cookie');
  };

  it('POST /auth', async () => {
    await loginAsAdminShouldSuccess();
  });

  it('POST /auth with invalid email', async () => {
    loginAsAdminShouldFail('admin2@proyectoarima.tech', testPassword);
  });

  it('POST /auth with invalid password', async () => {
    loginAsAdminShouldFail(testUsername, 'admin2');
  });

  // TODO: Implement this test
  it.skip('POST /auth/setPassword', async () => {
    const passwordRecoveryResponse = await request(app).post(`/auth/passwordRecovery`).send({
      email: testUsername,
    });
    console.log(passwordRecoveryResponse);
    const response = await request(app).post(`/auth/setPassword?token=${testToken}`).send({
      email: testUsername,
      newPassword: 'admin2',
      newPasswordConfirmation: 'admin2',
    });
    const result: ApiResponse = response.body;

    expect(response.statusCode).toEqual(StatusCodes.OK);
    expect(result.success).toBeTruthy();
    expect(result.data).toBeNull();

    await loginAsAdminShouldFail(testUsername, 'admin');
    await loginAsAdminShouldSuccess(testUsername, 'admin2');
  });

  it('DELETE /auth', async () => {
    const accessToken = await loginAsAdminShouldSuccess();
    const response = await request(app).delete('/auth').set('Cookie', `access_token=${accessToken}`);
    expect(response.statusCode).toEqual(StatusCodes.OK);
    expect(response.header).not.toHaveProperty('Set-Cookie');
  });

  afterAll(async () => {
    await disconnectFromMongoDB();
  });
});
