import { StatusCodes } from 'http-status-codes';
import request from 'supertest';

import { setupTestEnvironment } from '@/fixture';
import { app } from '@/server';

/* Mock de AWS S3
vi.mock('@aws-sdk/client-s3', async (importOriginal) => {
  const AWS = await importOriginal<typeof import('@aws-sdk/client-s3')>();
  const S3 = {
    upload: vi.fn().mockReturnValue({
      promise: vi.fn().mockResolvedValue({
        Location: 'https://mocked-s3-url.com/file.jpg',
        Key: 'mocked-key',
      }),
    }),
  };
  console.log('S3 MOCK LOADED AAAAAA'); // Verificar que este mock se carga
  return {
    ...AWS,
    S3: vi.fn().mockImplementation(() => S3),
  };
});

// Mock de `awsManager`
vi.mock('@/common/utils/awsManager', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/common/utils/awsManager')>();
  console.log('awsManager mock LOADED BBBBBBBBBBBBBBB'); // Verificar que este mock se carga
  return {
    ...mod,
    s3Put: vi.fn().mockResolvedValue({ key: 'mocked-key' }),
    s3Get: vi.fn(),
  };
});*/

describe('Generic course tests', () => {
  setupTestEnvironment();

  const login = async (email = 'teacher@proyectoarima.tech', password = 'admin') => {
    const response = await request(app).post('/auth').send({
      email,
      password,
    });
    const result = response.body;
    return result.data?.['access_token'];
  };

  /*
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
  });*/

  /*
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
  });*/

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

  it('DELETE /courses/:courseId', async () => {
    const token = await login();

    const courseId = '66b2ba4bb24f72c9f4aac1d5';

    const response = await request(app).delete(`/courses/${courseId}`).set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.OK);
    const result = response.body;
    expect(result.success).toBe(true);
    expect(result.message).toBe('Course deleted successfully');
  });

  it('DELETE /courses/:courseId/sections/:sectionId', async () => {
    const token = await login();

    const courseId = '66b2ba4bb24f72c9f4aac1d5';
    const sectionId = '66b0e07bceed604f8977c1cc';

    const response = await request(app)
      .delete(`/courses/${courseId}/sections/${sectionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.OK);
    const result = response.body;
    expect(result.success).toBe(true);
    expect(result.message).toBe('Section deleted successfully');

    // Verificar que la sección ha sido eliminada
    const courseResponse = await request(app)
      .get(`/courses/${courseId}/sections`)
      .set('Authorization', `Bearer ${token}`);

    expect(courseResponse.status).toBe(StatusCodes.OK);
    const sections = courseResponse.body.data;
    expect(sections).toHaveLength(0);
  });

  it('GET /courses/:courseId/sections/:sectionId', async () => {
    const token = await login();

    const courseId = '66b2ba4bb24f72c9f4aac1d5';
    const sectionId = '66b0e07bceed604f8977c1cc';

    const response = await request(app)
      .get(`/courses/${courseId}/sections/${sectionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.OK);
    const result = response.body;
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('name', 'Aprendiendo mas');
    expect(result.data).toHaveProperty('description', 'dale que vos podes, entra a mi seccion.');
  });

  it('DELETE /courses/:courseId/users/:userId', async () => {
    const token = await login();

    const userId = '6643eb8662e9b625cd5dda4f'; // ID de usuario del estudiante
    const courseId = '66b2ba4bb24f72c9f4aac1d5'; // ID del curso que se va a eliminar

    const response = await request(app)
      .delete(`/courses/${courseId}/users/${userId}`)
      .send()
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(StatusCodes.OK);

    const courseResponse = await request(app).get(`/courses/${courseId}`).set('Authorization', `Bearer ${token}`);
    const course = courseResponse.body.data;

    const studentExists = course.students.some((student: { userId: string }) => student.userId === userId);

    expect(studentExists).toBe(false);
  });

  it('POST /courses/:courseId/sections/:sectionId/contents', async () => {
    const token = await login();

    const courseId = '66b2ba4bb24f72c9f4aac1d5';
    const sectionId = '66b0e07bceed604f8977c1cc';
    const contentData = {
      title: 'Test Content',
      publicationType: 'AUTOMATIC',
    };

    const response = await request(app)
      .post(`/courses/${courseId}/sections/${sectionId}/contents`)
      .field('title', contentData.title)
      .field('publicationType', contentData.publicationType)
      .attach('file', Buffer.from('dummy content'), 'testfile.txt')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.OK);
    const result = response.body;
    expect(result.success).toBe(true);
  });

  it('GET /courses/:courseId/sections/:sectionId/contents', async () => {
    const token = await login(); // Puedes ajustar el rol según los permitidos

    const courseId = '66b2ba4bb24f72c9f4aac1d5';
    const sectionId = '66b0e07bceed604f8977c1cc';

    const response = await request(app)
      .get(`/courses/${courseId}/sections/${sectionId}/contents`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toHaveProperty('id', '66b0e07bceed604f8977c0aa');
    expect(response.body.data[0]).toHaveProperty('key', 'fe6728c5-3919-462f-8f67-ad899edbe5fb');
  });
});
