import { User, UserCreation, UserDTO } from '@/api/user/userModel';
import { userRepository } from '@/api/user/userRepository';
import { Role } from '@/common/models/role';

import { InvalidCredentialsError } from '../auth/authModel';

export const userService = {
  // Retrieves all users from the database
  findAll: async (): Promise<UserDTO[]> => {
    const users: User[] = await userRepository.findAllAsync();
    return users.map((user: User) => user.toDto());
  },

  // Retrieves a single user by their ID
  findById: async (id: string): Promise<UserDTO> => {
    const user: User = await userRepository.findByIdAsync(id);
    if (!user) {
      throw new InvalidCredentialsError();
    }
    return user.toDto();
  },

  create: async (user: UserCreation): Promise<UserDTO> => {
    const createdUser: User = await userRepository.create(user);
    return createdUser.toDto();
  },

  getAllStudents: async (): Promise<UserDTO[]> => {
    const users = await userRepository.findUsersByRole(Role.STUDENT);
    return users.map((user) => user.toDto());
  },

  removeUserFromCourse: async (userId: string, courseId: string): Promise<void> => {
    await userRepository.removeUserFromCourse(userId, courseId);
  },
};
