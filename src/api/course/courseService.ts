import { Types } from 'mongoose';

import { Course, CourseCreation, CourseDTO, CourseModel } from '@/api/course/courseModel';
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
      throw new Error('Course not found'); // You can replace this with a more specific error if needed
    }
    return course.toDto();
  },

  create: async (course: CourseCreation): Promise<CourseDTO> => {
    const matriculationCode = generateMatriculationCode();
    const { studentEmails = [], ...courseData } = course;

    // Buscar estudiantes por emails usando el repository
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

  async findCoursesByTeacherId(teacherId: string): Promise<CourseDTO[]> {
    const courses = await CourseModel.find({ teacherId }).exec();
    return courses.map((course) => course.toDto());
  },

  async addSectionToCourse(courseId: string, sectionData: SectionCreationDTO): Promise<CourseDTO> {
    return await courseRepository.addSectionToCourse(courseId, sectionData);
  },

  async getSectionsOfCourse(courseId: string): Promise<any> {
    return await courseRepository.getSectionsOfCourse(courseId);
  },
};
