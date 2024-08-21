import { ContentDTO } from '@/api/course/content/contentModel';
import { contentRepository } from '@/api/course/content/contentRepository';

export const contentService = {
  addReactionToContent: async (contentId: string, isSatisfied: boolean, userId: string): Promise<ContentDTO | null> => {
    const updatedContent = await contentRepository.addReactionToContent(contentId, isSatisfied, userId);
    return updatedContent ? updatedContent : null;
  },

  getReactionsByContentId: async (
    contentId: string
  ): Promise<{ reactions: { userId: string; isSatisfied: boolean }[] } | null> => {
    return await contentRepository.getReactionsByContentId(contentId);
  },

  getContentById: async (contentId: string): Promise<ContentDTO> => {
    const content = await contentRepository.findById(contentId);
    return content.toDto();
  },
};
