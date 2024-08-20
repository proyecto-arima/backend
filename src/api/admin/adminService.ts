import bcrypt from 'bcrypt';

import { UserCreationDTO, UserDTO } from '@/api/user/userModel';
import { Role } from '@/common/models/role';
import { config } from '@/common/utils/config';
import { logger } from '@/common/utils/serverLogger';

import sendMailTo from '../../common/mailSender/mailSenderService';
import { userService } from '../user/userService';

export const adminService = {
  create: async (user: UserCreationDTO): Promise<UserDTO> => {
    logger.trace('[AdminService] - [create] - Start');
    logger.trace(`[AdminService] - [create] - Creating user: ${JSON.stringify(user)}`);
    logger.trace(`[AdminService] - [create] - Generating random password...`);
    const randomPassword = crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
    console.log('ADMIN PASS:', randomPassword);
    if (config.app.node_env === 'development') {
      logger.trace(`[AdminService] - [create] - Random password: ${randomPassword}`);
    }
    logger.trace(`[AdminService] - [create] - Hashing password...`);
    const hash = await bcrypt.hash(randomPassword, 10);
    logger.trace(`[AdminService] - [create] - Password hashed.`);
    logger.trace(`[AdminService] - [create] - Creating user...`);
    const createdUser: UserDTO = await userService.create({ ...user, password: hash, role: Role.ADMIN });
    logger.trace(`[AdminService] - [create] - User created: ${JSON.stringify(createdUser)}`);

    // TODO: Send email to user notifying them of their registration
    // It should force the user to change their password on first login
    logger.trace(`[AdminService] - [create] - Sending email to user ${createdUser.email}...`);
    sendMailTo(
      [createdUser.email],
      'Welcome to AdaptarIA admin panel',
      `<h1>Welcome to AdaptarIA admin panel</h1>
      <p>You have been registered as an admin in the platform. 
      Your username is ${createdUser.email} and your temporal password is ${randomPassword}. 
      Please login and change your password.</p>`
    ).then(() => logger.trace(`[AdminService] - [create] - Email sent.`));

    logger.trace('[AdminService] - [create] - End');

    return createdUser;
  },
};
