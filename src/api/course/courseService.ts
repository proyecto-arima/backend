import { Course, CourseCreation, CourseDTO, CourseModel } from '@/api/course/courseModel';
import { courseRepository } from '@/api/course/courseRepository';
import { SectionCreationDTO } from '@/api/course/section/sectionModel';

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

  async findCoursesByTeacherId(teacherId: string): Promise<CourseDTO[]> {
    const courses = await CourseModel.find({ teacherId }).exec();
    return courses.map((course) => course.toDto());
  },

  async addSectionToCourse(courseId: string, sectionData: SectionCreationDTO): Promise<CourseDTO> {
    const course = await CourseModel.findById(courseId).exec();
    if (!course) {
      throw new Error('Course not found'); // You can replace this with a more specific error if needed
    }
    return await courseRepository.addSectionToCourse(course, sectionData);
  },
};
