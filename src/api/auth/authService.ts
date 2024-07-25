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
  PasswordsDoNotMatchError,
  PasswordSet,
  SessionPayload,
  SessionPayloadSchema,
} from './authModel';

export const authService = {
  login: async (user: UserLoginDTO): Promise<SessionToken> => {
    try {
      const foundUser = await userRepository.findByEmail(user.email);
      if (!foundUser) {
        throw new InvalidCredentialsError();
      }

      const isPasswordValid = await bcrypt.compare(user.password, foundUser.password);
      if (!isPasswordValid) {
        throw new InvalidCredentialsError();
      }

      if (foundUser.forcePasswordReset) {
        throw new PasswordChangeRequiredError();
      }

      const userDto = foundUser.toDto();
      const token: SessionPayload = SessionPayloadSchema.parse({ id: userDto.id });
      const access_token = jwt.sign(token, config.jwt.secret as string, { expiresIn: '12h' });

      logger.info(`User ${getUsernameObfuscated(user.email)} logged in successfully`);
      return { access_token };
    } catch (ex) {
      logger.warn(`Error found: ${ex}`);
      if (ex instanceof InvalidCredentialsError) {
        logger.warn(`Invalid credentials for user ${getUsernameObfuscated(user.email)}`);
        throw new InvalidCredentialsError('Invalid credentials');
      }
      if (ex instanceof PasswordChangeRequiredError) {
        logger.warn(`User ${getUsernameObfuscated(user.email)} must change the password`);
        throw new PasswordChangeRequiredError(`The user ${getUsernameObfuscated(user.email)} is invalid`);
      } else {
        throw new Error(`Internal error`);
      }
    }
  },

  passwordSet: async (token: string, passwordSet: PasswordSet): Promise<void> => {
    try {
      const payload = jwt.verify(token, config.jwt.secret as string) as SessionPayload;
      if (!payload) {
        throw new JsonWebTokenError('Payload invalid');
      }
      if (passwordSet.newPassword !== passwordSet.newPasswordConfirmation) {
        throw new PasswordsDoNotMatchError('Passwords do not match');
      }

      const userFounded = await userRepository.findByEmail(passwordSet.email);
      if (!userFounded) {
        throw new InvalidCredentialsError('Received user null on password set');
      }
      const isPasswordSecure = checkPassword(passwordSet.newPassword);
      if (!isPasswordSecure) {
        throw new PasswordNotSecureError('Password not secure');
      }

      const hash = await bcrypt.hash(passwordSet.newPassword, 10);
      userFounded.password = hash;
      userFounded.forcePasswordReset = false;
      await userRepository.updateById(userFounded.toDto().id, userFounded);
      logger.warn(`Password successfully set for user ${getUsernameObfuscated(passwordSet.email)}`);
      return Promise.resolve();
    } catch (ex) {
      logger.warn(`Error found: ${ex}`);
      if (ex instanceof JsonWebTokenError) {
        logger.warn(`Payload received is invalid`);
        throw new JsonWebTokenError('Payload invalid');
      }
      if (ex instanceof PasswordsDoNotMatchError) {
        logger.warn(`Passwords received do not match`);
        throw new PasswordsDoNotMatchError('Passwords do not match');
      }
      if (ex instanceof InvalidCredentialsError) {
        logger.warn(`Received user null on password set`);
        throw new InvalidCredentialsError('Invalid user to set password');
      }
      if (ex instanceof PasswordNotSecureError) {
        logger.warn(`Password received is not secure`);
        throw new PasswordNotSecureError('Password not secure');
      } else {
        console.log('sarasaaaaa');

        throw new Error(`Internal error`);
      }
    }
  },

  passwordRecovery: async (email: string): Promise<void> => {
    try {
      const userFounded = await userRepository.findByEmail(email);
      if (!userFounded) {
        throw new InvalidCredentialsError('Received user null on recovery');
      }
      const token = jwt.sign({ email: userFounded.email }, config.jwt.secret as string, { expiresIn: '15m' });
      userFounded.forcePasswordReset = true;

      // TODO: React view not implemented yet
      // React view > POST /setPassword
      const redirectLink = `http://${config.app.host}:${config.app.port}/auth/recoverPassword?token=${token}&amp;name=${userFounded.email}`;
      sendMailTo(
        [userFounded.email],
        '[AdaptarIA] Account access',
        `<p>Hi ${userFounded.email},
        Go to the next link ${redirectLink} and use it to set your new password.
        </p>`
      );
      return Promise.resolve();
    } catch (ex) {
      logger.warn(`Error found: ${ex}`);
      if (ex instanceof InvalidCredentialsError) {
        logger.warn(`Received user null on recovery`);
        throw new InvalidCredentialsError('Invalid user to recover password');
      } else {
        throw new Error(`Internal error`);
      }
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
