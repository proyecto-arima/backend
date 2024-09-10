import { ContentDTO, ContentModel } from '@/api/course/content/contentModel';
import { contentRepository } from '@/api/course/content/contentRepository';

import { sectionRepository } from '../section/sectionRepository';

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

  async updateContentVisibility(contentId: string, visible: boolean): Promise<ContentDTO> {
    const content = await ContentModel.findByIdAndUpdate(contentId, { visible }, { new: true });

    if (!content) {
      throw new Error('Content not found');
    }

    return content.toDto();
  },

  async updateContentApproval(contentId: string, approve: Record<string, boolean>) {
    return contentRepository.updateApproval(contentId, approve);
  },

  async updateContentTitle(contentId: string, newTitle: string): Promise<ContentDTO> {
    const content = await ContentModel.findById(contentId);

    if (!content) {
      throw new Error('Content not found');
    }

    content.title = newTitle;
    await content.save();

    sectionRepository.updateContentInSection(contentId, newTitle);

    return content.toDto();
  },
};
