import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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
      if (foundUser.forcePasswordReset) {
        const token = jwt.sign({ email: user.email }, config.jwt.secret as string, { expiresIn: '1d' });
        // TODO: React view not implemented yet
        // React view > POST /setPassword
        const redirectLink = `http://${config.app.host}:${config.app.port}/auth/recoverPassword?token=${token}`;
        sendMailTo(
          [user.email],
          '[AdaptarIA] Account access',
          `<p>Hi ${user.email},
          Go to the next link ${redirectLink} and use the next password to access your account: 
          <b>Password:</b> ${user.password}
          </p>`
        );
      }
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

  passwordSet: async (token: string, passwordSet: PasswordSet): Promise<void> => {
    const payload = jwt.verify(token, config.jwt.secret as string) as SessionPayload;
    if (!payload) {
      throw new InvalidCredentialsError();
    }
    const user: User = await userRepository.findByEmail(passwordSet.email);
    if (!user) {
      throw new UserNotFoundError();
    }
    // TODO: check if new password is secure
    const hash = await bcrypt.hash(passwordSet.newPassword, 10);
    user.password = hash;
    user.forcePasswordReset = false;
    await userRepository.updateById(user.toDto().id, user);
    return Promise.resolve();
  },

  passwordRecovery: async (email: string): Promise<void> => {
    const user: User = await userRepository.findByEmail(email);
    if (!user) {
      throw new UserNotFoundError();
    }
    const token = jwt.sign({ email: user.email }, config.jwt.secret as string, { expiresIn: '15m' });
    // TODO: React view not implemented yet
    // React view > POST /setPassword
    const redirectLink = `http://${config.app.host}:${config.app.port}/auth/recoverPassword?token=${token}`;
    sendMailTo(
      [user.email],
      '[AdaptarIA] Account access',
      `<p>Hi ${user.email},
      Go to the next link ${redirectLink} and use the next password to access your account: 
      <b>Password:</b> ${user.password}
      </p>`
    );
    return Promise.resolve();
  },
};
