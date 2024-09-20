import { ContentModel } from '@/api/course/content/contentModel';
import { CourseModel } from '@/api/course/courseModel';
import { Section, SectionDTO, SectionModel, SectionUpdateDTO } from '@/api/course/section/sectionModel';

export const sectionRepository = {
  deleteSection: async (sectionId: string, courseId: string): Promise<void> => {
    await CourseModel.updateOne({ _id: courseId }, { $pull: { sections: { id: sectionId } } });
    await ContentModel.deleteMany({ sectionId });
    await SectionModel.deleteOne({ _id: sectionId });
  },

  findById: async (sectionId: string): Promise<Section> => {
    const section = await SectionModel.findById<Section>(sectionId).populate('contents').exec();
    if (!section) {
      throw new Error('Section not found');
    }
    return section;
  },

  async updateSection(sectionId: string, updateData: SectionUpdateDTO): Promise<SectionDTO> {
    // Actualizar la sección directamente en la colección de secciones
    const updatedSection = await SectionModel.findByIdAndUpdate(
      sectionId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();

    if (!updatedSection) {
      throw new Error('Section not found');
    }

    return updatedSection.toDto();
  },

  async updateContentInSection(contentId: string, newTitle: string): Promise<void> {
    // Actualizar el título en el array de contenidos de la sección
    await SectionModel.updateOne({ 'contents.id': contentId }, { $set: { 'contents.$.title': newTitle } });
  },
};
