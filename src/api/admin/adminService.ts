import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';

import { UserCreationDTO, UserDTO } from '@/api/user/userModel';
import { Role } from '@/common/models/role';
import { ResponseStatus, ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';

import sendMailTo from '../../common/mailSender/mailSenderService';
import { userService } from '../user/userService';

export const adminService = {
  create: async (user: UserCreationDTO): Promise<ServiceResponse<UserDTO | null>> => {
    const randomPassword = crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
    try {
      const hash = await bcrypt.hash(randomPassword, 10);
      const createdUser: UserDTO = await userService.create({ ...user, password: hash, role: Role.ADMIN });

      // TODO: Send email to user notifying them of their registration
      // It should force the user to change their password on first login

      sendMailTo(
        [createdUser.email],
        'Welcome to AdaptarIA admin panel',
        `<h1>Welcome to AdaptarIA admin panel</h1>
        <p>You have been registered as an admin in the platform. 
        Your username is ${createdUser.email} and your temporal password is ${randomPassword}. 
        Please login and change your password.</p>`
      );

      return new ServiceResponse(ResponseStatus.Success, 'Admin registered', createdUser, StatusCodes.CREATED);
    } catch (ex) {
      const errorMessage = `Error registering user: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return new ServiceResponse(ResponseStatus.Failed, errorMessage, null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  },
};
