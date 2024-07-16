import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';

import { UserCreationDTO, UserDTO } from '@/api/user/userModel';
import { Role } from '@/common/models/role';
import { ResponseStatus, ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';

import sendMailTo from '../../common/mailSender/mailSenderService';
import { userService } from '../user/userService';

export const studentService = {
  create: async (user: UserCreationDTO): Promise<ServiceResponse<UserDTO | null>> => {
    const randomPassword = crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
    try {
      const hash = await bcrypt.hash(randomPassword, 10);
      const createdUser: UserDTO = await userService.create({ ...user, password: hash, role: Role.STUDENT });

      // TODO: Send email to user notifying them of their registration
      // It should force the user to change their password on first login

      sendMailTo(
        [createdUser.email],
        'Welcome to the school',
        `<h1>Welcome to the school</h1>
        <p>You have been registered as a student in the school. 
        Your username is ${createdUser.email} and your password is ${randomPassword}. 
        Please login and change your password.</p>`
      );

      return new ServiceResponse(ResponseStatus.Success, 'Student registered', createdUser, StatusCodes.CREATED);
    } catch (ex) {
      const errorMessage = `Error registering user: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return new ServiceResponse(ResponseStatus.Failed, errorMessage, null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  },
};
