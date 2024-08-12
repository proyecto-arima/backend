import { User, UserCreation, UserDTO } from '@/api/user/userModel';
import { userRepository } from '@/api/user/userRepository';
import { Role } from '@/common/models/role';

import { InvalidCredentialsError } from '../auth/authModel';
import { directorRepository } from '../director/directorRepository';

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

  getAllStudents: async (directorUserId: string): Promise<UserDTO[]> => {
    const instituteId = await directorRepository.getInstituteId(directorUserId);
    const users = await userRepository.findUsersByRoleAndInstitute(Role.STUDENT, instituteId);
    return users.map((user) => user.toDto());
  },

  removeUserFromCourse: async (userId: string, courseId: string): Promise<void> => {
    await userRepository.removeUserFromCourse(userId, courseId);
  },

  async updateUserProfile(
    userId: string,
    updatedFields: Partial<{ email: string; firstName: string; lastName: string }>
  ): Promise<UserDTO> {
    const updatedUser = await userRepository.updateUserProfile(userId, updatedFields);

    if (!updatedUser) {
      throw new Error('User not found');
    }

    return updatedUser.toDto();
  },
};
