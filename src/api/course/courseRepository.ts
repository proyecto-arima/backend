import { Types } from 'mongoose';
import mongoose from 'mongoose';

import { ContentCreationDTO, ContentModel } from '@/api/course/content/contentModel';
import { Course, CourseCreation, CourseCreationDTO, CourseDTO, CourseModel } from '@/api/course/courseModel';
import { SectionCreationDTO, SectionModel } from '@/api/course/section/sectionModel';
import { UserModel } from '@/api/user/userModel';

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

  async findStudentsByEmails(emails: string[]): Promise<any[]> {
    return UserModel.find({ email: { $in: emails } }, { _id: 1, firstName: 1, lastName: 1 });
  },

  // Creates a new course
  create: async (course: CourseCreation): Promise<Course> => {
    const newCourse = await CourseModel.create<CourseCreationDTO>(course);
    return courseRepository.findByIdAsync(newCourse.id);
  },

  async findCoursesByTeacherId(teacherId: string): Promise<CourseDTO[]> {
    const courses = await CourseModel.find({ teacherId }).exec();
    return courses.map((course) => course.toDto());
  },

  addSectionToCourse: async (courseId: string, sectionData: SectionCreationDTO): Promise<any> => {
    // Crear la nueva sección
    const newSection = new SectionModel({
      name: sectionData.name,
      description: sectionData.description,
      visible: sectionData.visible,
    });

    const savedSection = await newSection.save();

    const course = await CourseModel.findById(courseId).exec();

    if (!course) {
      throw new Error('Course not found');
    }

    course.sections = course.sections || [];

    course.sections.push({
      id: savedSection._id as Types.ObjectId,
      name: newSection.name,
      description: newSection.description ?? '',
    });

    await course.save();
    // Retornar la sección recién creada en formato DTO
    return newSection.toDto();
  },

  getSectionsOfCourse: async (courseId: string): Promise<any[]> => {
    // Buscar el curso por ID y popular las secciones
    const course = await CourseModel.findById(courseId).populate('sections').exec();

    if (!course) {
      throw new Error('Course not found');
    }

    // Obtener los IDs de las secciones
    const sectionIds = course.sections?.map((section) => section.id);

    // Crear ObjectId a partir de cada ID en sectionIds
    const objectIdArray = sectionIds?.map((id) => new mongoose.Types.ObjectId(id));

    // Buscar las secciones en la base de datos usando ObjectId
    const sections = await SectionModel.find({ _id: { $in: objectIdArray } }).exec();

    // Devolver las secciones encontradas
    const sectionDtos = sections.map((section) => ({
      id: section.id.toString(),
      name: section.name,
      description: section.description,
      visible: section.visible,
      contents: section.contents?.map((content) => ({
        id: content.id.toString(),
        title: content.title,
      })),
    }));

    return sectionDtos;
  },

  addContentToSection: async (courseId: string, sectionId: string, contentData: ContentCreationDTO): Promise<any> => {
    const newContent = new ContentModel({
      title: contentData.title,
      sectionId, // Asegúrate de que `sectionId` se pase aquí
      publicationType: contentData.publicationType,
      publicationDate: contentData.publicationDate,
      file: contentData.file,
    });

    const savedContent = newContent.save();

    const section = await SectionModel.findById(sectionId).exec();

    if (!section) {
      throw new Error('Section not found');
    }

    section.contents = section?.contents || [];

    section.contents.push({
      id: (await savedContent)._id as Types.ObjectId,
      title: (await savedContent).title,
    });

    await section.save();

    return newContent.toDto();
  },

  async addStudentsToCourse(courseId: string, students: any[]): Promise<Course> {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Convertir ObjectId a string
    const formattedStudents = students.map((student) => ({
      id: student.id.toString(), // Convertir a string
      firstName: student.firstName,
      lastName: student.lastName,
    }));

    course.students.push(...formattedStudents);
    await course.save();
    return course;
  },
};
