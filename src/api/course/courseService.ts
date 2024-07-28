import { Types } from 'mongoose';

import { ContentCreationDTO, ContentDTO } from '@/api/course/content/contentModel';
import { Course, CourseCreation, CourseDTO } from '@/api/course/courseModel';
import { courseRepository } from '@/api/course/courseRepository';
import { SectionCreationDTO } from '@/api/course/section/sectionModel';

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

  create: async (course: CourseCreation): Promise<CourseDTO> => {
    const matriculationCode = generateMatriculationCode();
    const { studentEmails = [], ...courseData } = course;

    const students = await courseRepository.findStudentsByEmails(studentEmails);
    const courseWithCode = {
      ...courseData,
      matriculationCode,
      students: students.map((student) => ({
        id: student._id as Types.ObjectId,
        firstName: student.firstName,
        lastName: student.lastName,
      })),
    };

    const createdCourse: Course = await courseRepository.create(courseWithCode);
    return createdCourse.toDto();
  },

  async addStudentsToCourse(courseId: string, studentEmails: string[]): Promise<CourseDTO> {
    const students = await courseRepository.findStudentsByEmails(studentEmails);

    if (students.length != studentEmails.length) {
      throw new Error('One or more student emails do not exist');
    }

    const studentData = students.map((student) => ({
      id: student.id.toString(),
      firstName: student.firstName,
      lastName: student.lastName,
    }));

    const updatedCourse = await courseRepository.addStudentsToCourse(courseId, studentData);
    return updatedCourse.toDto();
  },

  async findCoursesByTeacherId(teacherId: string): Promise<CourseDTO[]> {
    return courseRepository.findCoursesByTeacherId(teacherId);
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

  async addContentToSection(sectionId: string, contentData: ContentCreationDTO): Promise<ContentDTO> {
    console.log('[courseService] - [addContentToSection] - Parameters:', { sectionId, contentData });
    return await courseRepository.addContentToSection(sectionId, contentData);
  },
};
