import { randomUUID } from 'crypto';
import { Types } from 'mongoose';

import { ContentCreationDTO, ContentDTO } from '@/api/course/content/contentModel';
import { Course, CourseCreation, CourseDTO } from '@/api/course/courseModel';
import { courseRepository } from '@/api/course/courseRepository';
import { SectionCreationDTO } from '@/api/course/section/sectionModel';
import { studentRepository } from '@/api/student/studentRepository';
import { teacherRepository } from '@/api/teacher/teacherRepository';
import { s3Get, s3Put } from '@/common/utils/awsManager';

const generateMatriculationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const courseService = {
  // Retrieves a course by its ID
  findById: async (id: string): Promise<CourseDTO> => {
    const course: Course | null = await courseRepository.findByIdAsync(id);
    if (!course) {
      throw new Error('Course not found');
    }
    return course.toDto();
  },

  create: async (course: CourseCreation, teacherUserId: string): Promise<CourseDTO> => {
    const matriculationCode = generateMatriculationCode();
    const { studentEmails = [], ...courseData } = course;

    const userStudents = await courseRepository.findStudentsByEmails(studentEmails);

    const courseWithCode = {
      ...courseData,
      matriculationCode,
      teacherUserId,
      students: userStudents.map((student) => ({
        userId: student._id as Types.ObjectId,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
      })),
    };

    const createdCourse: Course = await courseRepository.create(courseWithCode);

    // Update teacher's courses
    await teacherRepository.addCourseToTeacher(teacherUserId, {
      id: createdCourse._id as Types.ObjectId,
      courseName: createdCourse.title,
    });

    for (const userStudent of userStudents) {
      await studentRepository.addCourseToStudent(userStudent._id, {
        id: createdCourse._id as Types.ObjectId,
        courseName: createdCourse.title,
      });
    }

    return createdCourse.toDto();
  },

  async addStudentsToCourse(courseId: string, studentEmails: string[]): Promise<CourseDTO> {
    const userStudents = await courseRepository.findStudentsByEmails(studentEmails);

    if (userStudents.length != studentEmails.length) {
      throw new Error('One or more student emails do not exist');
    }

    const studentData = userStudents.map((student) => ({
      userId: student.id.toString(),
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
    }));

    const updatedCourse = await courseRepository.addStudentsToCourse(courseId, studentData);

    for (const userStudent of userStudents) {
      await studentRepository.addCourseToStudent(userStudent._id, {
        id: updatedCourse._id as Types.ObjectId,
        courseName: updatedCourse.title,
      });
    }

    return updatedCourse.toDto();
  },

  async findCoursesByTeacherId(teacherUserId: string): Promise<CourseDTO[]> {
    return courseRepository.findCoursesByTeacherId(teacherUserId);
  },

  async addSectionToCourse(courseId: string, sectionData: SectionCreationDTO): Promise<CourseDTO> {
    return await courseRepository.addSectionToCourse(courseId, sectionData);
  },

  async getSectionsOfCourse(courseId: string): Promise<any> {
    return await courseRepository.getSectionsOfCourse(courseId);
  },

  async getStudentsOfCourse(courseId: string): Promise<any> {
    return await courseRepository.getStudentsOfCourse(courseId);
  },

  async addContentToSection(
    sectionId: string,
    contentData: ContentCreationDTO,
    file: Express.Multer.File
  ): Promise<ContentDTO> {
    console.log('[courseService] - [addContentToSection] - Parameters:', { sectionId, contentData });
    const key = `${randomUUID()}`.toString();
    const preSignedUrl = await s3Put(key, file);
    return await courseRepository.addContentToSection(sectionId, contentData, key, preSignedUrl);
  },

  getContentsWithPresignedUrls: async (sectionId: string) => {
    const contents = await courseRepository.getContentsBySectionId(sectionId);

    if (!contents) {
      return [];
    }

    const contentsWithUrls = await Promise.all(
      contents.map(async (content) => {
        const presignedUrl = await s3Get(content.key);
        return {
          ...content,
          presignedUrl,
        };
      })
    );

    return contentsWithUrls;
  },
};
