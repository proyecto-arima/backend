import { CourseModel } from '@/api/course/courseModel';
import { StudentModel } from '@/api/student/studentModel';
import { User, UserCreation, UserCreationDTO, UserModel, UserNotFoundError } from '@/api/user/userModel';

export const userRepository = {
  findAllAsync: async (): Promise<User[]> => UserModel.find<User>(),

  findByIdAsync: async (id: string): Promise<User> => {
    const user = await UserModel.findById<User>(id);
    if (!user) {
      throw new UserNotFoundError('User not found');
    }
    return user;
  },

  create: async (user: UserCreation): Promise<User> => {
    const newUser = await UserModel.create<UserCreationDTO>(user);
    return userRepository.findByIdAsync(newUser.id);
  },

  findByEmail: async (email: string): Promise<User | null> => {
    return await UserModel.findOne<User>({ email });
  },

  updateById: async (id: string, user: User): Promise<User> => {
    const updatedUser = await UserModel.findByIdAndUpdate<User>(id, user, { new: true });
    if (!updatedUser) {
      return Promise.reject();
    }
    return updatedUser;
  },

  findUsersByRole: async (role: string): Promise<User[]> => {
    return UserModel.find<User>({ role }).exec();
  },

  removeUserFromCourse: async (userId: string, courseId: string): Promise<void> => {
    const session = await UserModel.startSession();
    session.startTransaction();

    try {
      await CourseModel.updateOne({ _id: courseId }, { $pull: { students: { userId: userId } } }, { session });

      await StudentModel.updateOne({ userId: userId }, { $pull: { courses: { id: courseId } } }, { session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  async updateUserProfile(
    userId: string,
    updatedFields: Partial<{ email: string; firstName: string; lastName: string }>
  ) {
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updatedFields },
      { new: true, runValidators: true }
    ).exec();
    return updatedUser;
  },
};
