import { sectionRepository } from '@/api/course/section/sectionRepository';

import { SectionDTO } from './sectionModel';

export const sectionService = {
  async deleteSection(sectionId: string, courseId: string): Promise<void> {
    return sectionRepository.deleteSection(sectionId, courseId);
  },

  async findById(sectionId: string): Promise<SectionDTO> {
    const section = await sectionRepository.findById(sectionId);
    return section.toDto();
  },
};
