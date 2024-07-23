import { Course, CourseCreation, CourseCreationDTO, CourseModel } from '@/api/course/courseModel';

export const courseRepository = {
  // Retrieves all courses from the database
  findAllAsync: async (): Promise<Course[]> => CourseModel.find<Course>(),

  // Retrieves a course by its ID
  findByIdAsync: async (id: string): Promise<Course> => {
    const course = await CourseModel.findById<Course>(id);
    if (!course) {
      return Promise.reject(new Error('Course not found'));
    }
    return course;
  },

  // Creates a new course
  create: async (course: CourseCreation): Promise<Course> => {
    const newCourse = await CourseModel.create<CourseCreationDTO>(course);
    return courseRepository.findByIdAsync(newCourse.id);
  },

  // Optionally, you can add more methods here for additional functionality
  // For example: findByMatriculationCode, update, delete, etc.
};
