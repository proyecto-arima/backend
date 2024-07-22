import { User, UserCreation, UserCreationDTO, UserModel } from '@/api/user/userModel';

import { UserNotFoundError } from '../auth/authModel';

export const userRepository = {
  findAllAsync: async (): Promise<User[]> => UserModel.find<User>(),

  findByIdAsync: async (id: string): Promise<User> => {
    const user = await UserModel.findById<User>(id);
    if (!user) {
      return Promise.reject(new Error('User not found'));
    }
    return user;
  },

  create: async (user: UserCreation): Promise<User> => {
    const newUser = await UserModel.create<UserCreationDTO>(user);
    return userRepository.findByIdAsync(newUser.id);
  },

  findByEmail: async (email: string): Promise<User> => {
    const user = await UserModel.findOne<User>({ email });
    if (!user) {
      throw new UserNotFoundError();
    }
    return user;
  },

  updateById: async (id: string, user: User): Promise<User> => {
    const updatedUser = await UserModel.findByIdAndUpdate<User>(id, user, { new: true });
    if (!updatedUser) {
      return Promise.reject(new Error('User not found'));
    }
    return updatedUser;
  }
};
