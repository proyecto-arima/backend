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

  async deleteContent(contentId: string): Promise<void> {
    const content = await ContentModel.findById(contentId);

    if (!content) {
      throw new Error('Content not found');
    }
    return contentRepository.deleteContent(contentId, content.sectionId);
  },

  async updateGeneratedContent(contentId: string, contentType: string, newContent: string): Promise<ContentDTO> {
    const content = await ContentModel.findById(contentId);

    if (!content) {
      throw new Error('Content not found');
    }

    const generatedContent = content.generated?.find((item) => item.type === contentType);

    if (!generatedContent) {
      throw new Error('Generated content not found');
    }

    generatedContent.content = newContent;
    await content.save();

    return content.toDto();
  },

  async updateAudio(contentId: string, newContent: any[]): Promise<ContentDTO> {
    const content = await ContentModel.findById(contentId);

    if (!content) {
      throw new Error('Content not found');
    }

    const generatedContent = content.generated?.find((item) => item.type === 'SPEECH');

    if (!generatedContent) {
      throw new Error('Generated content not found');
    }

    generatedContent.content = newContent;
    //generatedContent.content.status = 'PENDING_AUDIO';
    content.status = 'PENDING_AUDIO';
    await content.save();

    return content.toDto();
  },

  async regenerateContent(contentId: string): Promise<ContentDTO> {
    const content = await ContentModel.findById(contentId);

    if (!content) {
      throw new Error('Content not found');
    }

    content.status = 'RETRY';

    await content.save();

    return content.toDto();
  },
};
