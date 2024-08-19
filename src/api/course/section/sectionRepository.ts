import { ContentModel } from '@/api/course/content/contentModel';
import { CourseModel } from '@/api/course/courseModel';
import { Section, SectionModel } from '@/api/course/section/sectionModel';

export const sectionRepository = {
  deleteSection: async (sectionId: string, courseId: string): Promise<void> => {
    const session = await SectionModel.startSession();
    session.startTransaction();

    try {
      // Elimina la sección del array de secciones del curso
      await CourseModel.updateOne({ _id: courseId }, { $pull: { sections: { id: sectionId } } }, { session });

      // Elimina todos los contenidos asociados a la sección
      await ContentModel.deleteMany({ sectionId }, { session });

      // Elimina la sección de la colección de secciones
      await SectionModel.deleteOne({ _id: sectionId }, { session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  findById: async (sectionId: string): Promise<Section> => {
    const section = await SectionModel.findById<Section>(sectionId).populate('contents').exec();
    if (!section) {
      throw new Error('Section not found');
    }
    return section;
  },
};
