import { Course, CourseCreation, CourseDTO } from '@/api/course/courseModel';
import { courseRepository } from '@/api/course/courseRepository';

export const courseService = {
  // Retrieves a course by its ID
  findById: async (id: string): Promise<CourseDTO> => {
    const course: Course | null = await courseRepository.findByIdAsync(id);
    if (!course) {
      throw new Error('Course not found'); // You can replace this with a more specific error if needed
    }
    return course.toDto();
  },

  // Creates a new course
  create: async (course: CourseCreation): Promise<CourseDTO> => {
    const createdCourse: Course = await courseRepository.create(course);
    return createdCourse.toDto();
  },
};
