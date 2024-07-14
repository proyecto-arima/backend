import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { SessionToken, User, UserLoginDTO } from '@/api/user/userModel';
import { userRepository } from '@/api/user/userRepository';
import { ObjectId } from '@/common/utils/commonTypes';
import { logger } from '@/server';

import { PasswordReset } from './authModel';

export const authService = {
  login: async (user: UserLoginDTO): Promise<SessionToken> => {
    try {
      const foundUser: User = await userRepository.findByEmail(user.email);
      if (!foundUser) {
        //return new ServiceResponse(ResponseStatus.Failed, 'Invalid credentials', null, StatusCodes.UNAUTHORIZED);
        return Promise.reject(new Error('Invalid credentials'));
      }
      const isPasswordValid = await bcrypt.compare(user.password, foundUser.password);
      if (!isPasswordValid) {
        //return new ServiceResponse(ResponseStatus.Failed, 'Invalid credentials', null, StatusCodes.UNAUTHORIZED);
        return Promise.reject(new Error('Invalid credentials'));
      }
      //return new ServiceResponse(ResponseStatus.Success, 'User logged in', foundUser.toDto(), StatusCodes.OK);
      const userDto = foundUser.toDto();
      return {
        access_token: jwt.sign({ id: userDto.id }, process.env.JWT_SECRET as string, { expiresIn: '12h' }),
      };
    } catch (ex) {
      const errorMessage = `Error logging in user: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return Promise.reject(new Error(errorMessage));
    }
  },

  resetPassword: async (id: ObjectId, passwordReset: PasswordReset): Promise<void> => {
    try {
      const user: User = await userRepository.findByIdAsync(id);
      if (!user) {
        return Promise.reject(new Error('Invalid credentials'));
      }
      const oldPasswordValid = await bcrypt.compare(passwordReset.oldPassword, user.password);
      if (!oldPasswordValid) {
        return Promise.reject(new Error('Invalid credentials'));
      }
      if (passwordReset.newPassword !== passwordReset.newPasswordConfirmation) {
        return Promise.reject(new Error('Invalid credentials'));
      }
      if (!user.forcePasswordReset) {
        return Promise.reject(new Error('Invalid credentials'));
      }

      // TODO: temp password expiration

      const hash = await bcrypt.hash(passwordReset.newPassword, 10);
      user.password = hash;
      user.forcePasswordReset = false;
      await userRepository.update(id, user);
      return Promise.resolve();
    } catch (ex) {
      const errorMessage = `Error resetting password: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return Promise.reject(new Error(errorMessage));
    }
  },
};
