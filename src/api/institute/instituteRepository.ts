import { InstituteCreationDTO, InstituteDTO, InstituteModel } from '@/api/institute/instituteModel';

export const instituteRepository = {
  findAll: async (): Promise<InstituteDTO[]> => {
    const institutes = await InstituteModel.find().exec();
    return institutes.map((institute) => institute.toDto());
  },

  create: async (instituteData: InstituteCreationDTO): Promise<InstituteDTO> => {
    const institute = new InstituteModel(instituteData);
    await institute.save();
    return institute.toDto();
  },
};
