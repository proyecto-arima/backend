import bcrypt from 'bcrypt';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import { SessionToken, User, UserLoginDTO } from '@/api/user/userModel';
import { userRepository } from '@/api/user/userRepository';
import sendMailTo from '@/common/mailSender/mailSenderService';
import { config } from '@/common/utils/config';
import { logger } from '@/common/utils/serverLogger';

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
      logger.trace('[AuthService] - [login] - Start');
      logger.trace(`[AuthService] - [login] - Finding user by email: ${user.email}...`);
      const foundUser: User = await userRepository.findByEmail(user.email);
      logger.trace(`[AuthService] - [login] - User found: ${JSON.stringify(foundUser)}`);
      logger.trace(`[AuthService] - [login] - Comparing passwords...`);
      const isPasswordValid = await bcrypt.compare(user.password, foundUser.password);
      if (!isPasswordValid) {
        logger.trace(`[AuthService] - [login] - Password is not valid, throwing InvalidCredentialsError`);
        throw new InvalidCredentialsError();
      }
      logger.trace(`[AuthService] - [login] - Password is valid, creating session token`);
      const userDto = foundUser.toDto();
      const token: SessionPayload = SessionPayloadSchema.parse({ id: userDto.id });
      const access_token = jwt.sign(token, config.jwt.secret as string, { expiresIn: '12h' });
      logger.trace(`[AuthService] - [login] - Session token created`);
      return { access_token };
    } catch (ex) {
      logger.trace(`[AuthService] - [login] - Error: ${ex}`);
      if (ex instanceof UserNotFoundError) {
        throw new InvalidCredentialsError(); // Map UserNotFoundError to InvalidCredentialsError for login!
      }
      throw ex;
    }
  },

  passwordSetAtFirstLogin: async (id: string, passwordSet: PasswordSet): Promise<void> => {
    logger.trace('[AuthService] - [passwordSetAtFirstLogin] - Start');
    logger.trace(`[AuthService] - [passwordSetAtFirstLogin] - Finding user by id: ${id}...`);
    const user: User = await userRepository.findByIdAsync(id);
    logger.trace(`[AuthService] - [passwordSetAtFirstLogin] - User found: ${JSON.stringify(user)}`);
    logger.trace(`[AuthService] - [passwordSetAtFirstLogin] - Comparing passwords...`);
    const oldPasswordValid = await bcrypt.compare(passwordSet.initPassword, user.password);
    if (!oldPasswordValid) {
      logger.trace(
        `[AuthService] - [passwordSetAtFirstLogin] - Password is not valid, throwing InvalidCredentialsError`
      );
      throw new InvalidCredentialsError();
    }
    if (passwordSet.newPassword !== passwordSet.newPasswordConfirmation) {
      logger.trace(
        `[AuthService] - [passwordSetAtFirstLogin] - New password and confirmation do not match, throwing InvalidCredentialsError`
      );
      throw new InvalidCredentialsError();
    }
    logger.trace(`[AuthService] - [passwordSetAtFirstLogin] - Setting new password...`);
    const hash = await bcrypt.hash(passwordSet.newPassword, 10);
    logger.trace(`[AuthService] - [passwordSetAtFirstLogin] - New password hashed`);
    user.password = hash;
    user.forcePasswordReset = false;
    logger.trace(`[AuthService] - [passwordSetAtFirstLogin] - Updating user...`);
    await userRepository.update(id, user);
    logger.trace(`[AuthService] - [passwordSetAtFirstLogin] - User updated`);
    return Promise.resolve();
  },

  passwordResetRequest: async (email: string): Promise<void> => {
    logger.trace('[AuthService] - [passwordResetRequest] - Start');
    logger.trace(`[AuthService] - [passwordResetRequest] - Finding user by email: ${email}...`);
    const user: User = await userRepository.findByEmail(email);
    logger.trace(`[AuthService] - [passwordResetRequest] - User found: ${JSON.stringify(user)}`);
    logger.trace(`[AuthService] - [passwordResetRequest] - Creating token...`);
    const token = jwt.sign({ email: user.email }, config.jwt.secret as string, { expiresIn: '15m' });
    logger.trace(`[AuthService] - [passwordResetRequest] - Token created`);
    user.forcePasswordReset = true;

    // TODO: Setup the correct link
    const resetPasswordLink = `${config.app.frontendUrl}/auth/resetPassword?token=${token}`;
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
    logger.trace('[AuthService] - [passwordResetResponse] - Start');
    logger.trace(`[AuthService] - [passwordResetResponse] - Verifying token...`);
    const decoded = jwt.verify(token, config.jwt.secret as string);
    logger.trace(`[AuthService] - [passwordResetResponse] - Token verified`);
    if (!decoded) {
      logger.trace(`[AuthService] - [passwordResetResponse] - Token not valid, throwing TokenExpiredError`);
      throw new TokenExpiredError('Token not valid', new Date());
    }
    logger.trace(`[AuthService] - [passwordResetResponse] - Finding user by id: ${id}...`);
    const user: User = await userRepository.findByIdAsync(id);
    logger.trace(`[AuthService] - [passwordResetResponse] - User found: ${JSON.stringify(user)}`);
    logger.trace(`[AuthService] - [passwordResetResponse] - Setting new password`);
    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    user.forcePasswordReset = false;
    logger.trace(`[AuthService] - [passwordResetResponse] - Updating user...`);
    await userRepository.update(id, user);
    logger.trace(`[AuthService] - [passwordResetResponse] - User updated successfully`);
    return Promise.resolve();
  },
};
