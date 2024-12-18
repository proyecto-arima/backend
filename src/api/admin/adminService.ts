import bcrypt from 'bcrypt';

import { UserCreationDTO, UserDTO } from '@/api/user/userModel';
import { Role } from '@/common/models/role';
import { config } from '@/common/utils/config';
import { logger } from '@/common/utils/serverLogger';

import { userService } from '../user/userService';

export const adminService = {
  create: async (user: UserCreationDTO): Promise<UserDTO> => {
    logger.trace('[AdminService] - [create] - Start');
    logger.trace(`[AdminService] - [create] - Creating user: ${JSON.stringify(user)}`);
    logger.trace(`[AdminService] - [create] - Generating random password...`);

    const randomPassword = crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
    if (config.app.node_env === 'development') {
      logger.trace(`[AdminService] - [create] - Random password: ${randomPassword}`);
    }

    logger.trace(`[AdminService] - [create] - Hashing password...`);
    const hash = await bcrypt.hash(randomPassword, 10);
    logger.trace(`[AdminService] - [create] - Password hashed.`);
    logger.trace(`[AdminService] - [create] - Creating user...`);

    const createdUser: UserDTO = await userService.create({ ...user, password: hash, role: Role.ADMIN });
    logger.trace(`[AdminService] - [create] - User created: ${JSON.stringify(createdUser)}`);
    logger.trace('[AdminService] - [create] - End');

    return createdUser;
  },
};
