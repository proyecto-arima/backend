import { Content, ContentDTO, ContentModel } from '@/api/course/content/contentModel';

export const contentRepository = {
  async getReactionsByContentId(
    contentId: string
  ): Promise<{ reactions: { idStudent: string; isSatisfied: boolean }[] } | null> {
    const content = await ContentModel.findById(contentId).exec();
    if (!content) {
      return null;
    }
    return { reactions: content.reactions || [] };
  },

  async addReactionToContent(contentId: string, isSatisfied: boolean, idStudent: string): Promise<ContentDTO | null> {
    const content = await ContentModel.findById(contentId).exec();
    if (!content) {
      return null;
    }

    if (!content.reactions) {
      content.reactions = [];
    }

    const existingReactionIndex = content.reactions.findIndex((r) => r.idStudent === idStudent);

    if (existingReactionIndex !== -1) {
      content.reactions[existingReactionIndex].isSatisfied = isSatisfied;
    } else {
      content.reactions.push({ idStudent, isSatisfied });
    }

    await content.save();
    return content.toDto();
  },

  async findById(contentId: string): Promise<Content> {
    const content = await ContentModel.findById<Content>(contentId).exec();
    if (!content) {
      throw new Error('Content not found');
    }
    return content;
  },
};
