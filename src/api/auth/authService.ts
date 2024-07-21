import bcrypt from 'bcrypt';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import { SessionToken, User, UserLoginDTO } from '@/api/user/userModel';
import { userRepository } from '@/api/user/userRepository';
import sendMailTo from '@/common/mailSender/mailSenderService';
import { config } from '@/common/utils/config';

import {
  InvalidCredentialsError,
  PasswordSet,
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

  passwordSetAtFirstLogin: async (id: string, passwordSet: PasswordSet): Promise<void> => {
    const user: User = await userRepository.findByIdAsync(id);
    if (!user) {
      throw new UserNotFoundError();
    }
    const oldPasswordValid = await bcrypt.compare(passwordSet.initPassword, user.password);
    if (!oldPasswordValid) {
      throw new InvalidCredentialsError();
    }
    if (passwordSet.newPassword !== passwordSet.newPasswordConfirmation) {
      throw new InvalidCredentialsError();
    }
    const hash = await bcrypt.hash(passwordSet.newPassword, 10);
    user.password = hash;
    user.forcePasswordReset = false;
    await userRepository.update(id, user);
    return Promise.resolve();
  },

  passwordResetRequest: async (email: string): Promise<void> => {
    const user: User = await userRepository.findByEmail(email);
    if (!user) {
      // TODO: Only log, do not throw error to send to the client
      throw new UserNotFoundError();
      // return Promise.resolve();
    }
    const token = jwt.sign({ email: user.email }, config.jwt.secret as string, { expiresIn: '15m' });
    user.forcePasswordReset = true;

    // TODO: Setup the correct link
    const resetPasswordLink = `https://example.com/accountRecovery?token=${token}`;
    sendMailTo(
      [user.email],
      '[AdaptarIA] Account recovery',
      `<p>Hi ${user.email}, you requested recently the recovery of your account
      Please, copy and paste the next link on your browser to set your new password.
      Be advise that this link will expire in 15 minutes.
      <a href="${resetPasswordLink}">Link</a>
      Do not share this link with anyone, ever for AdaptarIA staff!
      </p>`
    );
    return Promise.resolve();
  },

  passwordResetResponse: async (id: string, token: string, newPassword: string): Promise<void> => {
    if (!token) {
      throw new TokenExpiredError('Token not found', new Date());
    }
    const decoded = jwt.verify(token, config.jwt.secret as string);
    if (!decoded) {
      throw new TokenExpiredError('Token not valid', new Date());
    }
    const user: User = await userRepository.findByIdAsync(id);
    if (!user) {
      throw new UserNotFoundError();
    }
    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    user.forcePasswordReset = false;
    await userRepository.update(id, user);
    return Promise.resolve();
  },
};
