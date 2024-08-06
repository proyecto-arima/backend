import { ContentDTO } from '@/api/course/content/contentModel';
import { contentRepository } from '@/api/course/content/contentRepository';

export const contentService = {
  addReactionToContent: async (
    contentId: string,
    isSatisfied: boolean,
    idStudent: string
  ): Promise<ContentDTO | null> => {
    const updatedContent = await contentRepository.addReactionToContent(contentId, isSatisfied, idStudent);
    return updatedContent ? updatedContent : null;
  },

  getReactionsByContentId: async (
    contentId: string
  ): Promise<{ reactions: { idStudent: string; isSatisfied: boolean }[] } | null> => {
    return await contentRepository.getReactionsByContentId(contentId);
  },
};
