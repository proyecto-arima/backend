import { User } from '@/api/user/userModel';

export const users: User[] = [];

export const userRepository = {
  findAllAsync: async (): Promise<User[]> => {
    return users;
  },

  findByIdAsync: async (id: number): Promise<User | null> => {
    return users.find((user) => user.id === id) || null;
  },

  registerAsync: async (user: User): Promise<void> => {
    const userWithAuditoryFields = {
      ...user,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    users.push(userWithAuditoryFields);
  },
};
