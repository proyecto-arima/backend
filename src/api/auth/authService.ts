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
      // test
      logger.trace(`User to set password: ${JSON.stringify(sessionPayload)}`);

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
      if (ex instanceof JsonWebTokenError) {
        logger.trace('[AuthService] - [passwordSet] - Payload invalid');
        throw new JsonWebTokenError('Payload invalid');
      }
      if (ex instanceof PasswordsDoNotMatchError) {
        logger.trace('[AuthService] - [passwordSet] - Passwords do not match');
        throw new PasswordsDoNotMatchError('Passwords do not match');
      }
      if (ex instanceof InvalidCredentialsError) {
        logger.trace('[AuthService] - [passwordSet] - Invalid user to set password');
        throw new InvalidCredentialsError('Invalid user to set password');
      }
      if (ex instanceof PasswordNotSecureError) {
        logger.trace('[AuthService] - [passwordSet] - Password not secure');
        throw new PasswordNotSecureError('Password not secure');
      } else {
        logger.error(`[AuthService] - [passwordSet] - Internal error: ${ex}`);
        throw new Error(`Internal error ${ex}`);
      }
    } finally {
      logger.trace(`[AuthService] - [passwordSet] - End`);
    }
  },

  passwordRecovery: async (passwordReset: PasswordReset): Promise<void> => {
    try {
      logger.trace(`[AuthService] - [passwordRecovery] - Start`);
      const user = await userRepository.findByEmail(passwordReset.email);
      if (!user) {
        throw new InvalidCredentialsError();
      }
      const token = jwt.sign({ id: user.toDto().id }, config.jwt.secret as string, { expiresIn: '15m' });
      user.forcePasswordReset = true;

      // TODO: React view not implemented yet
      // React view > POST /setPassword
      const redirectLink = `http://${config.app.host}:${config.app.port}/auth/recoverPassword?token=${token}`;
      sendMailTo(
        [user.email],
        '[AdaptarIA] Account access',
        `<p>Hi ${user.email},
        Go to the next link ${redirectLink} and use it to set your new password on adaptarIA
        </p>`
      );
      return Promise.resolve();
    } catch (ex) {
      logger.trace(`[AuthService] - [passwordRecovery] - Error found: ${ex}`);
      if (ex instanceof InvalidCredentialsError) {
        logger.trace('[AuthService] - [passwordRecovery] - Invalid user to recover password');
        throw new InvalidCredentialsError('Invalid user to recover password');
      } else {
        logger.error(`[AuthService] - [passwordRecovery] - Internal error: ${ex}`);
        throw new Error(`Internal error ${ex}`);
      }
    } finally {
      logger.trace(`[AuthService] - [passwordRecovery] - End`);
    }
  },
};

export function checkPassword(password: string) {
  const minLength = 8;
  // const hastAtLeastOneEspecialCharacter = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);
  // const hasFourNumbers = /\d{4}/.test(password);
  // const hasAtLeastOneUppercase = /[A-Z]+/.test(password);
  return password.length >= minLength; // && hastAtLeastOneEspecialCharacter && hasFourNumbers && hasAtLeastOneUppercase;
}

export function getUsernameObfuscated(username: string) {
  return `****@${username ? username.split('@')[1]?.slice(0, 100) : '****'}`;
}
