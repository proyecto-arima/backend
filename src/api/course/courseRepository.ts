import { Types } from 'mongoose';
import mongoose from 'mongoose';

import { Course, CourseCreation, CourseCreationDTO, CourseModel } from '@/api/course/courseModel';
import { SectionCreationDTO, SectionModel } from '@/api/course/section/sectionModel';

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

  addSectionToCourse: async (courseId: string, sectionData: SectionCreationDTO): Promise<any> => {
    try {
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
    } catch (error) {
      // Manejo de errores
      return Promise.reject(error);
    }
  },

  getSectionsOfCourse: async (courseId: string): Promise<any[]> => {
    try {
      // Buscar el curso por ID y popular las secciones
      const course = await CourseModel.findById(courseId).populate('sections').exec();

      if (!course) {
        throw new Error('Course not found');
      }

      // Obtener los IDs de las secciones
      const sectionIds = course.sections?.map((section) => section.id);
      console.log('ID DE SECCIONES:', sectionIds);

      // Crear ObjectId a partir de cada ID en sectionIds
      const objectIdArray = sectionIds?.map((id) => new mongoose.Types.ObjectId(id));
      console.log('OBJECT ID ARRAY:', objectIdArray);

      // Buscar las secciones en la base de datos usando ObjectId
      const sections = await SectionModel.find({ _id: { $in: objectIdArray } }).exec();
      console.log('SECTIONS:', sections);

      // Devolver las secciones encontradas
      const sectionDtos = sections.map((section) => ({
        id: section.id.toString(),
        name: section.name,
        description: section.description,
        visible: section.visible, // Asegúrate de que este campo esté en tu esquema de sección
      }));

      console.log('SECTION DTOS:', sectionDtos);

      return sectionDtos;
    } catch (error) {
      return Promise.reject(error);
    }
  },
};
