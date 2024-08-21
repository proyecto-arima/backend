import { Content, ContentDTO, ContentModel } from '@/api/course/content/contentModel';

export const contentRepository = {
  async getReactionsByContentId(
    contentId: string
  ): Promise<{ reactions: { userId: string; isSatisfied: boolean }[] } | null> {
    const content = await ContentModel.findById(contentId).exec();
    if (!content) {
      return null;
    }
    return { reactions: content.reactions || [] };
  },

  async addReactionToContent(contentId: string, isSatisfied: boolean, userId: string): Promise<ContentDTO | null> {
    const content = await ContentModel.findById(contentId).exec();
    if (!content) {
      return null;
    }

    if (!content.reactions) {
      content.reactions = [];
    }

    const existingReactionIndex = content.reactions.findIndex((r) => r.userId.toString() === userId);

    if (existingReactionIndex !== -1) {
      content.reactions[existingReactionIndex].isSatisfied = isSatisfied;
    } else {
      content.reactions.push({ userId: userId, isSatisfied });
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
