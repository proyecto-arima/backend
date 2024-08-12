import bcrypt from 'bcrypt';

import { DirectorModel } from '@/api/director/directorModel';
import { UserDirectorCreationDTO, UserDTO } from '@/api/user/userModel';
import { Role } from '@/common/models/role';
import { config } from '@/common/utils/config';
import { logger } from '@/common/utils/serverLogger';

import sendMailTo from '../../common/mailSender/mailSenderService';
import { userService } from '../user/userService';

export const directorService = {
  create: async (user: UserDirectorCreationDTO): Promise<UserDTO> => {
    logger.trace('[DirectorService] - [create] - Start');
    logger.trace(`[DirectorService] - [create] - Creating user: ${JSON.stringify(user)}`);
    logger.trace(`[DirectorService] - [create] - Generating random password...`);
    const randomPassword = crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
    if (config.app.node_env === 'development') {
      logger.trace(`[DirectorService] - [create] - Random password: ${randomPassword}`);
    }
    logger.trace(`[DirectorService] - [create] - Hashing password...`);
    const hash = await bcrypt.hash(randomPassword, 10);
    logger.trace(`[DirectorService] - [create] - Password hashed.`);
    logger.trace(`[DirectorService] - [create] - Creating user...`);
    const createdUser: UserDTO = await userService.create({ ...user, password: hash, role: Role.DIRECTOR });
    logger.trace(`[DirectorService] - [create] - User created: ${JSON.stringify(createdUser)}`);

    // TODO: Send email to user notifying them of their registration
    // It should force the user to change their password on first login

    const director = new DirectorModel({
      userId: createdUser.id,
      instituteId: user.instituteId,
    });

    await director.save();

    logger.trace(`[DirectorService] - [create] - Sending email to user ${createdUser.email}...`);
    sendMailTo(
      [createdUser.email],
      'Welcome to the school',
      `<h1>Welcome to the school</h1>
      <p>You have been registered as a director in the school. 
      Your username is ${createdUser.email} and your password is ${randomPassword}. 
      Please login and change your password.</p>`
    ).then(() => logger.trace(`[Director] - [create] - Email sent.`));

    logger.trace('[DirectorService] - [create] - End');
    return createdUser;
  },
};
