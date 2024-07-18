import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { SessionToken, User, UserLoginDTO } from '@/api/user/userModel';
import { userRepository } from '@/api/user/userRepository';
import { config } from '@/common/utils/config';

import {
  InvalidCredentialsError,
  PasswordReset,
  SessionPayload,
  SessionPayloadSchema,
  UserNotFoundError,
} from './authModel';

export const authService = {
  login: async (user: UserLoginDTO): Promise<SessionToken> => {
    try {
      const foundUser: User = await userRepository.findByEmail(user.email);
      const isPasswordValid = await bcrypt.compare(user.password, foundUser.password);
      if (!isPasswordValid) {
        throw new InvalidCredentialsError();
      }
      const userDto = foundUser.toDto();
      const token: SessionPayload = SessionPayloadSchema.parse({ id: userDto.id });
      const access_token = jwt.sign(token, config.jwt.secret as string, { expiresIn: '12h' });
      return { access_token };
    } catch (ex) {
      if (ex instanceof UserNotFoundError) {
        throw new InvalidCredentialsError(); // Map UserNotFoundError to InvalidCredentialsError for login!
      }
      throw ex;
    }
  },

  resetPassword: async (id: string, passwordReset: PasswordReset): Promise<void> => {
    const user: User = await userRepository.findByIdAsync(id);
    if (!user) {
      throw new UserNotFoundError();
    }
    const oldPasswordValid = await bcrypt.compare(passwordReset.oldPassword, user.password);
    if (!oldPasswordValid) {
      throw new InvalidCredentialsError();
    }
    if (passwordReset.newPassword !== passwordReset.newPasswordConfirmation) {
      throw new InvalidCredentialsError();
    }

    // TODO: temp password expiration
    const hash = await bcrypt.hash(passwordReset.newPassword, 10);
    user.password = hash;
    user.forcePasswordReset = false;
    await userRepository.update(id, user);
    return Promise.resolve();
  },
};
