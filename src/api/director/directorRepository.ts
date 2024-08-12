import { DirectorDTO, DirectorModel } from '@/api/director/directorModel';

export const directorRepository = {
  findByUserIdAsync: async (directorUserId: string): Promise<DirectorDTO> => {
    const director = await DirectorModel.findOne({ userId: directorUserId }).exec();
    if (!director) {
      return Promise.reject(new Error('Director not found'));
    }
    return director.toDto();
  },

  getInstituteId: async (directorUserId: string): Promise<string> => {
    const director = await directorRepository.findByUserIdAsync(directorUserId);
    return director.instituteId;
  },
};