import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import { ApiResponse } from '@/common/models/apiResponse';
import { connectToMongoDB, disconnectFromMongoDB } from '@/common/utils/mongodb';
import { app } from '@/server';

vi.mock('@/common/mailSender/mailSenderService', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/common/mailSender/mailSenderService')>();
  return {
    ...mod,
    sendMailTo: vi.fn(),
  };
});

describe('Authentication tests', () => {
  const testUsername = 'admin@proyectoarima.tech';
  const testPassword = 'admin';
  let testToken = '';

  

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
    const testingUserId = (await mongoose.connection.db.collection('users').insertOne(testingUser)).insertedId;
    testToken = jwt.sign({ id: testingUserId }, 'secret' as string, { expiresIn: '15m' });

    vi.doMock('jsonwebtoken', async (importOriginal) => {
      const mod = await importOriginal<typeof import('jsonwebtoken')>();
      return {
        ...mod,
        verify: vi.fn().mockReturnValue(true),
        sign: vi.fn().mockReturnValue(testToken),
        decode: vi.fn().mockReturnValue({ id: testingUserId }),
      };
    });
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

  it('POST /auth/setPassword', async () => {
    const newPassword = 'superadmin123!';
    await request(app).post(`/auth/passwordRecovery`).send({
      email: testUsername,
    });

    const response = await request(app).post(`/auth/setPassword?token=${testToken}`).send({
      email: testUsername,
      newPassword: newPassword,
      newPasswordConfirmation: newPassword,
    });
    const result: ApiResponse = response.body;

    expect(response.statusCode).toEqual(StatusCodes.OK);
    expect(result.success).toBeTruthy();
    expect(result.data).toBeNull();

    await loginAsAdminShouldFail(testUsername, 'admin');
    await loginAsAdminShouldSuccess(testUsername, newPassword);
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
