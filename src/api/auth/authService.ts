import bcrypt from 'bcrypt';
import jwt, { JsonWebTokenError } from 'jsonwebtoken';

import { SessionToken, UserLoginDTO } from '@/api/user/userModel';
import { userRepository } from '@/api/user/userRepository';
import sendMailTo from '@/common/mailSender/mailSenderService';
import { config } from '@/common/utils/config';
import { logger } from '@/common/utils/serverLogger';

import {
  InvalidCredentialsError,
  PasswordChangeRequiredError,
  PasswordNotSecureError,
  PasswordReset,
  PasswordsDoNotMatchError,
  PasswordSet,
  SessionPayload,
  SessionPayloadSchema,
} from './authModel';

export const authService = {
  login: async (user: UserLoginDTO): Promise<SessionToken> => {
    try {
      logger.trace('[AuthService] - [login] - Start');
      logger.trace(`[AuthService] - [login] - Finding user by email: ${user.email}...`);
      const foundUser = await userRepository.findByEmail(user.email);
      if (!foundUser) {
        throw new InvalidCredentialsError();
      }
      logger.trace(`[AuthService] - [login] - User found: ${JSON.stringify(foundUser)}`);

      logger.trace(`[AuthService] - [login] - Comparing passwords...`);
      const isPasswordValid = await bcrypt.compare(user.password, foundUser.password);
      if (!isPasswordValid) {
        logger.trace(`[AuthService] - [login] - Password is not valid, throwing InvalidCredentialsError`);
        throw new InvalidCredentialsError();
      }

      logger.trace(`[AuthService] - [login] - Checking if user needs to reset password...`);
      if (foundUser.forcePasswordReset) {
        throw new PasswordChangeRequiredError();
      }

      logger.trace(`[AuthService] - [login] - User is valid, creating session token`);
      const token: SessionPayload = SessionPayloadSchema.parse({ id: foundUser.toDto().id });
      const access_token = jwt.sign(token, config.jwt.secret as string, { expiresIn: '12h' });

      logger.info(`[AuthService] - [login] - User ${getUsernameObfuscated(user.email)} logged in successfully`);
      return { access_token };
    } catch (ex) {
      logger.trace(`[AuthService] - [login] - Error found: ${ex}`);
      if (ex instanceof InvalidCredentialsError) {
        logger.trace(`[AuthService] - [login] - Invalid credentials for user ${getUsernameObfuscated(user.email)}`);
        throw new InvalidCredentialsError('Invalid credentials');
      }
      if (ex instanceof PasswordChangeRequiredError) {
        logger.trace(
          `[AuthService] - [login] - Password change required for user ${getUsernameObfuscated(user.email)}`
        );
        throw new PasswordChangeRequiredError(`The user ${getUsernameObfuscated(user.email)} is invalid`);
      } else {
        logger.error(`[AuthService] - [login] - Internal error: ${ex}`);
        throw new Error(`Internal error: ${ex}`);
      }
    }
  },

  passwordSet: async (token: string | undefined, passwordSet: PasswordSet): Promise<void> => {
    try {
      logger.trace(`[AuthService] - [passwordSet] - Start`);
      if (!token) {
        throw new JsonWebTokenError('Received token null');
      }

      const payload = jwt.verify(token, config.jwt.secret as string) as SessionPayload;
      if (!payload) {
        throw new JsonWebTokenError('Payload invalid');
      }

      if (passwordSet.newPassword !== passwordSet.newPasswordConfirmation) {
        throw new PasswordsDoNotMatchError();
      }

      const sessionPayload: SessionPayload = SessionPayloadSchema.parse(jwt.decode(token, { json: true }));
      const user = await userRepository.findByIdAsync(sessionPayload.id.toString());
      if (!user) {
        throw new InvalidCredentialsError();
      }
      const isPasswordSecure = checkPassword(passwordSet.newPassword);
      if (!isPasswordSecure) {
        throw new PasswordNotSecureError();
      }

      const hash = await bcrypt.hash(passwordSet.newPassword, 10);
      user.password = hash;
      user.forcePasswordReset = false;
      await userRepository.updateById(user.toDto().id, user);
      logger.info(
        `[AuthService] - [passwordSet] - Password set successfully for user ${getUsernameObfuscated(user.email)}`
      );
      return Promise.resolve();
    } catch (ex) {
      logger.trace(`[AuthService] - [passwordSet] - Error found: ${ex}`);
      throw new Error(`Internal error ${ex}`);
    } finally {
      logger.trace(`[AuthService] - [passwordSet] - End`);
    }
  },

  passwordRecovery: async (passwordReset: PasswordReset): Promise<void> => {
    try {
      logger.trace(`[AuthService] - [passwordRecovery] - Start`);
      const user = await userRepository.findByEmail(passwordReset.email);
      if (!user) {
        return Promise.resolve();
      }
      const token = jwt.sign({ id: user.toDto().id }, config.jwt.secret as string, { expiresIn: '15m' });
      user.forcePasswordReset = true;
      sendMailTo({
        to: [user.email],
        subject: `[AdaptarIA] Recuperación de tu cuenta - ${user.firstName}`,
        bodyTemplateName: 'password_recovery',
        templateParams: {
          username: user.email,
          redirectLink: `${config.app.frontendUrl}/recoverPassword?token=${token}`,
        },
      });
      return Promise.resolve();
    } catch (ex) {
      logger.error(`[AuthService] - [passwordRecovery] - Internal error: ${ex}`);
      throw new Error(`Internal error ${ex}`);
    } finally {
      logger.trace(`[AuthService] - [passwordRecovery] - End`);
    }
  },
};

export function checkPassword(password: string) {
  const hasMinLength = password.length >= 8;
  const hastAtLeastOneEspecialCharacter = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/.test(password);
  const hasNumbers = /\d{2}/.test(password);
  const hasAtLeastOneUppercase = /[A-Z]+/.test(password);
  if (config.app.node_env === 'development') {
    return hasMinLength;
  }
  return hasMinLength && hastAtLeastOneEspecialCharacter && hasNumbers && hasAtLeastOneUppercase;
}

export function getUsernameObfuscated(username: string) {
  return `****@${username ? username.split('@')[1]?.slice(0, 100) : '****'}`;
}
