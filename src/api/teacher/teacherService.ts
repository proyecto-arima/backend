import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';

import { UserCreationDTO, UserDTO } from '@/api/user/userModel';
import { ApiResponse, ResponseStatus } from '@/common/models/apiResponse';
import { Role } from '@/common/models/role';
import { logger } from '@/server';

import { userService } from '../user/userService';

// TODO: Reimplementar para no repetir
export const teacherService = {
  create: async (user: UserCreationDTO): Promise<ApiResponse<UserDTO | null>> => {
    const randomPassword = crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
    try {
      const hash = await bcrypt.hash(randomPassword, 10);
      const createdUser: UserDTO = await userService.create({ ...user, password: hash, role: Role.TEACHER });
      // TODO: Send email to user notifying them of their registration
      // It should force the user to change their password on first login
      return new ApiResponse(ResponseStatus.Success, 'Teacher registered', createdUser, StatusCodes.CREATED);
    } catch (ex) {
      const errorMessage = `Error registering user: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return new ApiResponse(ResponseStatus.Failed, errorMessage, null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  },
};
