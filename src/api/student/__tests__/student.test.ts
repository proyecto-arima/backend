import { StatusCodes } from 'http-status-codes';
import request from 'supertest';

import { setupTestEnvironment } from '@/fixture';
import { app } from '@/server';

describe('Generic student tests', () => {
  setupTestEnvironment();

  const studentLogin = async (email = 'student@proyectoarima.tech', password = 'admin') => {
    const response = await request(app).post('/auth').send({
      email,
      password,
    });
    const result = response.body;
    return result.data?.['access_token'];
  };

  const directorLogin = async (email = 'director@proyectoarima.tech', password = 'admin') => {
    const response = await request(app).post('/auth').send({
      email,
      password,
    });
    const result = response.body;
    return result.data?.['access_token'];
  };

  it('GET /students/me/courses', async () => {
    const token = await studentLogin();

    const response = await request(app).get('/students/me/courses').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.OK);
    const result = response.body;
    expect(result.success).toBe(true);
    const courses = result.data;
    expect(courses).toHaveLength(1);
    expect(courses[0]).toHaveProperty('title', 'Course 1');
  });

  it('GET /students/', async () => {
    const token = await directorLogin();

    const response = await request(app).get('/students/').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.OK);
    const result = response.body;
    expect(result.success).toBe(true);
    const students = result.data;
    expect(students).toHaveLength(2);
    expect(students[0]).toHaveProperty('firstName', 'Student');
  });

  //TODO: VER ESTE TEST, FALLA EL ENVIO DE MAIL EN EL TEST
  /* 
  it('POST /students/', async () => {
    const studentData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      document: {
        type: 'DNI',
        number: '123456789',
      }
    };

    const response = await request(app).post('/students/').send(studentData);

    expect(response.status).toBe(StatusCodes.CREATED);
    const result = response.body;
    expect(result.success).toBeTruthy();
    expect(result.data).toHaveProperty('id');
  });*/

  it('GET /students/:id/learning-profile', async () => {
    const token = await studentLogin();

    const studentId = '6643eb8662e9b625cd5dda3c';

    const response = await request(app)
      .get(`/students/${studentId}/learning-profile`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.OK);
    const result = response.body;
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('learningProfile', 'CONVERGENTE');
  });
});
