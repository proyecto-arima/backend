import { DirectorModel } from '@/api/director/directorModel';
import { InstituteDTO, InstituteModel } from '@/api/institute/instituteModel';
import { StudentModel } from '@/api/student/studentModel';
import { TeacherModel } from '@/api/teacher/teacherModel';
import { User, UserCreation, UserDTO } from '@/api/user/userModel';
import { userRepository } from '@/api/user/userRepository';
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

  // Retrieves a single user by their ID
  findById: async (id: string): Promise<any> => {
    const user: User = await userRepository.findByIdAsync(id);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    let instituteId: string | null = null;
    let learningProfile: string | null = null;

    // Verifica el rol del usuario
    if (user.role === Role.DIRECTOR) {
      const director = await DirectorModel.findOne({ userId: id }).exec();
      if (director) {
        instituteId = director.institute.id;
      }
    } else if (user.role === Role.TEACHER) {
      const teacher = await TeacherModel.findOne({ userId: id }).exec();
      if (teacher) {
        instituteId = teacher.institute.id;
      }
    } else if (user.role === Role.STUDENT) {
      const student = await StudentModel.findOne({ userId: id }).exec();
      if (student) {
        instituteId = student.institute.id;
        learningProfile = student.learningProfile;
      }
    }

    // Trae la información de la institución si existe
    let institute: InstituteDTO | null = null;
    if (instituteId) {
      const foundInstitute = await InstituteModel.findById(instituteId).exec();
      if (foundInstitute) {
        institute = foundInstitute.toDto();
      }
    }

    // Retorna el UserDTO con la información adicional
    return {
      ...user.toDto(),
      ...(institute && { institute }), // Solo agrega `institute` si no es `null` o `undefined`
      ...(learningProfile && { learningProfile }), // Solo agrega `learningProfile` si no es `null` o `undefined`
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
