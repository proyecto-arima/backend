import { sectionRepository } from '@/api/course/section/sectionRepository';

export const sectionService = {
  async deleteSection(sectionId: string, courseId: string): Promise<void> {
    return sectionRepository.deleteSection(sectionId, courseId);
  },
};
