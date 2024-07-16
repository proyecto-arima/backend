import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';

import { SessionToken, User, UserCreation, UserDTO, UserLoginDTO } from '@/api/user/userModel';
import { userRepository } from '@/api/user/userRepository';
import { ResponseStatus, ServiceResponse } from '@/common/models/serviceResponse';
import { ObjectId } from '@/common/utils/commonTypes';
import { logger } from '@/server';

export const userService = {
  // Retrieves all users from the database
  findAll: async (): Promise<ServiceResponse<UserDTO[] | null>> => {
    try {
      const users: User[] = await userRepository.findAllAsync();
      if (!users) {
        return new ServiceResponse(ResponseStatus.Failed, 'No Users found', null, StatusCodes.NOT_FOUND);
      }
      return new ServiceResponse<UserDTO[]>(
        ResponseStatus.Success,
        'Users found',
        users.map((u) => u.toDto()),
        StatusCodes.OK
      );
    } catch (ex) {
      const errorMessage = `Error finding all users: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return new ServiceResponse(ResponseStatus.Failed, errorMessage, null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  },

  // Retrieves a single user by their ID
  findById: async (id: ObjectId): Promise<ServiceResponse<UserDTO | null>> => {
    try {
      const user: User = await userRepository.findByIdAsync(id);
      if (!user) {
        return new ServiceResponse(ResponseStatus.Failed, 'User not found', null, StatusCodes.NOT_FOUND);
      }
      return new ServiceResponse<UserDTO>(ResponseStatus.Success, 'User found', user.toDto(), StatusCodes.OK);
    } catch (ex) {
      const errorMessage = `Error finding user with id ${id}:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return new ServiceResponse(ResponseStatus.Failed, errorMessage, null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  },

  // register: async (user: UserCreationDTO): Promise<ServiceResponse<UserDTO | null>> => {
  //   try {
  //     const hash = await bcrypt.hash(user.password, 10);
  //     const createdUser: User = await userRepository.create({ ...user, password: hash });
  //     return new ServiceResponse(ResponseStatus.Success, 'User registered', createdUser.toDto(), StatusCodes.CREATED);
  //   } catch (ex) {
  //     const errorMessage = `Error registering user: ${(ex as Error).message}`;
  //     logger.error(errorMessage);
  //     return new ServiceResponse(ResponseStatus.Failed, errorMessage, null, StatusCodes.INTERNAL_SERVER_ERROR);
  //   }
  // },

  create: async (user: UserCreation): Promise<UserDTO> => {
    const createdUser: User = await userRepository.create(user);
    return createdUser.toDto();
  },

  login: async (user: UserLoginDTO): Promise<SessionToken> => {
    try {
      const foundUser: User = await userRepository.findByEmail(user.email);
      if (!foundUser) {
        //return new ServiceResponse(ResponseStatus.Failed, 'Invalid credentials', null, StatusCodes.UNAUTHORIZED);
        logger.debug(`User not found with email: ${user.email}`);
        return Promise.reject(new Error('Invalid credentials'));
      }

      const isPasswordValid = await bcrypt.compare(user.password, foundUser.password);
      if (!isPasswordValid) {
        //return new ServiceResponse(ResponseStatus.Failed, 'Invalid credentials', null, StatusCodes.UNAUTHORIZED);
        logger.debug(`Invalid password for user with email: ${user.email}`);
        return Promise.reject(new Error('Invalid credentials'));
      }
      //return new ServiceResponse(ResponseStatus.Success, 'User logged in', foundUser.toDto(), StatusCodes.OK);
      const userDto = foundUser.toDto();
      return {
        access_token: jwt.sign({ id: userDto.id }, process.env.JWT_SECRET as string, { expiresIn: '12h' }),
      };
    } catch (ex) {
      logger.debug(`Error logging in user: ${(ex as Error).message}`);
      const errorMessage = `Invalid credentials`;
      return Promise.reject(new Error(errorMessage));
    }
  },
};
