import { StatusCodes } from 'http-status-codes';
import request from 'supertest';

import { setupTestEnvironment } from '@/fixture';
import { app } from '@/server';

describe('Generic teacher tests', () => {
  setupTestEnvironment();

  const login = async (email = 'specific@proyectoarima.tech', password = 'admin') => {
    const response = await request(app).post('/auth').send({
      email,
      password,
    });
    const result = response.body;
    return result.data?.['access_token'];
  };

  it('GET /me/courses', async () => {
    const token = await login();

    const response = await request(app).get('/teachers/me/courses').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.OK);
    const result = response.body;
    expect(result.success).toBe(true);
    const courses = result.data;
    expect(courses).toHaveLength(1);
    expect(courses[0]).toHaveProperty('title', 'Course 3');
  });
});
