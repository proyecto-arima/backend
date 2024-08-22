import { StatusCodes } from 'http-status-codes';
import request from 'supertest';

import { setupTestEnvironment } from '@/fixture';
import { app } from '@/server';

describe('Content retrieval tests', () => {
  setupTestEnvironment();

  const studentLogin = async (email = 'student@proyectoarima.tech', password = 'admin') => {
    const response = await request(app).post('/auth').send({
      email,
      password,
    });
    const result = response.body;
    return result.data?.['access_token'];
  };

  const teacherLogin = async (email = 'teacher@proyectoarima.tech', password = 'admin') => {
    const response = await request(app).post('/auth').send({
      email,
      password,
    });
    const result = response.body;
    return result.data?.['access_token'];
  };

  it('GET /contents/:contentId', async () => {
    const token = await studentLogin();

    const contentId = '66b0e07bceed604f8977c0aa';

    const response = await request(app).get(`/contents/${contentId}`).set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.OK);
    const result = response.body;
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('title', 'CSharp bla');
    expect(result.data).toHaveProperty('key', 'fe6728c5-3919-462f-8f67-ad899edbe5fb');
  });

  it('PATCH /contents/:contentId/visibility', async () => {
    const token = await teacherLogin();

    const contentId = '66b0e07bceed604f8977c0aa';
    const visibilityData = { visible: false };

    const response = await request(app)
      .patch(`/contents/${contentId}/visibility`)
      .set('Authorization', `Bearer ${token}`)
      .send(visibilityData);

    expect(response.status).toBe(StatusCodes.OK);
    const result = response.body;
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('title', 'CSharp bla');
    expect(result.data).toHaveProperty('visible', false);
  });
});
