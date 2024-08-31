import { ContentModel } from '@/api/course/content/contentModel';
import { CourseModel } from '@/api/course/courseModel';
import { Section, SectionModel } from '@/api/course/section/sectionModel';

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
};
