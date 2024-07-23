import bcrypt from 'bcrypt';

import { UserCreationDTO, UserDTO } from '@/api/user/userModel';
import sendMailTo from '@/common/mailSender/mailSenderService';
import { Role } from '@/common/models/role';
import { config } from '@/common/utils/config';
import { logger } from '@/common/utils/serverLogger';

import { userService } from '../user/userService';

export const studentService = {
  create: async (user: UserCreationDTO): Promise<UserDTO> => {
    logger.trace('[StudentService] - [create] - Start');
    logger.trace(`[StudentService] - [create] - Creating user: ${JSON.stringify(user)}`);
    logger.trace(`[StudentService] - [create] - Generating random password...`);
    const randomPassword = crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
    if (config.app.node_env === 'development') {
      logger.trace(`[StudentService] - [create] - Random password: ${randomPassword}`);
    }
    logger.trace(`[StudentService] - [create] - Hashing password...`);
    const hash = await bcrypt.hash(randomPassword, 10);

    logger.trace(`[StudentService] - [create] - Password hashed.`);
    logger.trace(`[StudentService] - [create] - Creating user...`);
    const createdUser: UserDTO = await userService.create({ ...user, password: hash, role: Role.STUDENT });
    logger.trace(`[StudentService] - [create] - User created: ${JSON.stringify(createdUser)}`);

    // TODO: Send email to user notifying them of their registration
    // It should force the user to change their password on first login

    logger.trace(`[StudentService] - [create] - Sending email to user ${createdUser.email}...`);
    sendMailTo(
      [createdUser.email],
      'Welcome to the school',
      `<h1>Welcome to the school</h1>
      <p>You have been registered as a student in the school.
      Your username is ${createdUser.email} and your password is ${randomPassword}.
      Please login and change your password.</p>`
    );
    logger.trace(`[StudentService] - [create] - Email sent.`);

    return createdUser;
  },
};
