import { OpenApiGeneratorV3, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

import { authRegistry } from '@/api/auth/authRouter';
import { contentRegistry } from '@/api/course/content/contentRouter';
import { courseRegistry } from '@/api/course/courseRouter';
import { directorRegistry } from '@/api/director/directorRouter';
import { healthCheckRegistry } from '@/api/healthCheck/healthCheckRouter';
import { instituteRegistry } from '@/api/institute/instituteRouter';
import { testRegistry } from '@/api/learningTest/testRouter';
import { studentRegistry } from '@/api/student/studentRouter';
import { teacherRegistry } from '@/api/teacher/teacherRouter';
import { userRegistry } from '@/api/user/userRouter';

export function generateOpenAPIDocument() {
  const registry = new OpenAPIRegistry([
    healthCheckRegistry,
    userRegistry,
    authRegistry,
    directorRegistry,
    studentRegistry,
    teacherRegistry,
    courseRegistry,
    contentRegistry,
    instituteRegistry,
    testRegistry,
  ]);
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'Swagger API',
    },
    externalDocs: {
      description: 'View the raw OpenAPI Specification in JSON format',
      url: '/swagger.json',
    },
  });
}
