import { DirectorModel } from '@/api/director/directorModel';
import { InstituteModel } from '@/api/institute/instituteModel';
import { StudentModel } from '@/api/student/studentModel';
import { TeacherModel } from '@/api/teacher/teacherModel';
import { User, UserCreation, UserDTO } from '@/api/user/userModel';
import { userRepository } from '@/api/user/userRepository';
import { LearningProfile } from '@/common/models/learningProfile';
import { Role } from '@/common/models/role';

import { InvalidCredentialsError } from '../auth/authModel';
import { directorRepository } from '../director/directorRepository';
import { teacherRepository } from '../teacher/teacherRepository';

export const userService = {
  // Retrieves all users from the database
  findAll: async (): Promise<UserDTO[]> => {
    const users: User[] = await userRepository.findAllAsync();
    return users.map((user: User) => user.toDto());
  },

  findById: async (id: string): Promise<any> => {
    const user: User = await userRepository.findByIdAsync(id);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    let instituteName: string | null = null;
    let learningProfile: LearningProfile | null = null;

    // Verifica el rol del usuario
    if (user.role === Role.DIRECTOR) {
      const director = await DirectorModel.findOne({ user: id }).lean().exec();
      if (director) {
        const foundInstitute = await InstituteModel.findById(director.institute).select('name').lean().exec();
        if (foundInstitute) {
          instituteName = foundInstitute.name;
        }
      }
    } else if (user.role === Role.TEACHER) {
      const teacher = await TeacherModel.findOne({ user: id }).lean().exec();
      if (teacher) {
        const foundInstitute = await InstituteModel.findById(teacher.institute).select('name').lean().exec();
        if (foundInstitute) {
          instituteName = foundInstitute.name;
        }
      }
    } else if (user.role === Role.STUDENT) {
      const student = await StudentModel.findOne({ user: id }).lean().exec();
      if (student) {
        const foundInstitute = await InstituteModel.findById(student.institute).select('name').lean().exec();
        if (foundInstitute) {
          instituteName = foundInstitute.name;
        }
        if (student.learningProfile) {
          learningProfile = student.learningProfile;
        }
      }
    }

    // Retorna el UserDTO con la información adicional
    return {
      ...user.toDto(),
      ...(instituteName && { instituteName }), // Solo agrega `instituteName` si no es `null` o `undefined`
      ...(learningProfile && { learningProfile }),
    };
  },

  create: async (user: UserCreation): Promise<UserDTO> => {
    const createdUser: User = await userRepository.create(user);
    return createdUser.toDto();
  },

  getAllStudents: async (userId: string): Promise<UserDTO[]> => {
    const user: User = await userRepository.findByIdAsync(userId);

    let instituteId = null;
    if (user.role === Role.DIRECTOR) {
      instituteId = await directorRepository.getInstituteId(userId);
    } else if (user.role === Role.TEACHER) {
      const teacher = await teacherRepository.findByUserIdAsync(userId);
      instituteId = teacher.institute;
    }
    const users = await userRepository.findUsersByRoleAndInstitute(Role.STUDENT, instituteId);
    return users.map((user) => user.toDto());
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
