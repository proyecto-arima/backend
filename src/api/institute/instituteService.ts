import { logger } from '@/common/utils/serverLogger';

import { InstituteCreationDTO, InstituteDTO, InstituteModel } from './instituteModel';

export const instituteService = {
  create: async (instituteData: InstituteCreationDTO): Promise<InstituteDTO> => {
    logger.trace('[InstituteService] - [create] - Start');
    logger.trace(`[InstituteService] - [create] - Creating institute with data: ${JSON.stringify(instituteData)}`);

    const institute = new InstituteModel(instituteData);
    await institute.save();

    logger.trace(`[InstituteService] - [create] - Institute created: ${JSON.stringify(institute.toDto())}`);
    logger.trace('[InstituteService] - [create] - End');

    return institute.toDto();
  },
};
