import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { directorRepository } from '@/api/director/directorRepository';
import { StudentModel } from '@/api/student/studentModel';
import { UserCreationDTO, UserDTO } from '@/api/user/userModel';
import sendMailTo from '@/common/mailSender/mailSenderService';
import { LearningProfile } from '@/common/models/learningProfile';
import { Role } from '@/common/models/role';
import { config } from '@/common/utils/config';
import { logger } from '@/common/utils/serverLogger';

import { userService } from '../user/userService';

export const studentService = {
  create: async (user: UserCreationDTO, directorUserId: string): Promise<UserDTO> => {
    logger.trace('[StudentService] - [create] - Start');
    logger.trace(`[StudentService] - [create] - Creating user: ${JSON.stringify(user)}`);
    logger.trace(`[StudentService] - [create] - Generating random password...`);
    const randomPassword = crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
    console.log('STUDENT PASS:', randomPassword);
    console.log('PASSWORD', randomPassword);
    if (config.app.node_env === 'development') {
      logger.trace(`[StudentService] - [create] - Random password: ${randomPassword}`);
    }
    logger.trace(`[StudentService] - [create] - Hashing password...`);
    const hash = await bcrypt.hash(randomPassword, 10);

    logger.trace(`[StudentService] - [create] - Password hashed.`);
    logger.trace(`[StudentService] - [create] - Creating user...`);
    const createdUser: UserDTO = await userService.create({ ...user, password: hash, role: Role.STUDENT });
    logger.trace(`[StudentService] - [create] - User created: ${JSON.stringify(createdUser)}`);

    // Crear la entrada en la colección de estudiantes
    logger.trace(`[StudentService] - [create] - Creating student entry...`);

    const instituteId = await directorRepository.getInstituteId(directorUserId);

    const student = new StudentModel({
      user: createdUser.id,
      institute: instituteId,
      courses: [],
    });

    await student.save();

    logger.trace(`[StudentService] - [create] - Student entry created.`);
    logger.trace(`[StudentService] - [create] - Sending email to user ${createdUser.email}...`);

    const token = jwt.sign({ id: createdUser.id }, config.jwt.secret as string, { expiresIn: '72h' });
    sendMailTo({
      to: [createdUser.email],
      subject: 'Bienvenido a AdaptarIA!',
      bodyTemplateName: 'student_welcome',
      templateParams: {
        studentName: createdUser.firstName,
        studentEmail: createdUser.email,
        studentInstitution: student.toDto().institute.name,
        reset_password_link: `${config.app.frontendUrl}/recoverPassword?token=${token}`,
      },
    });
    logger.trace(`[StudentService] - [create] - Email sent`);
    return createdUser;
  },

  createMultiple: async (students: UserCreationDTO[], directorUserId: string): Promise<UserDTO[]> => {
    logger.trace('[StudentService] - [createMultiple] - Start');
    const createdStudents: UserDTO[] = [];

    for (const user of students) {
      const createdUser: UserDTO = await studentService.create(user, directorUserId);

      logger.trace(`[StudentService] - [createMultiple] - Student created: ${JSON.stringify(createdUser)}`);
      createdStudents.push(createdUser);
    }

    logger.trace('[StudentService] - [createMultiple] - All students created successfully');
    return createdStudents;
  },

  getLearningProfile: async (id: string): Promise<LearningProfile> => {
    const student = await StudentModel.findOne({ user: id }).exec();
    if (!student) {
      return Promise.reject(new Error('Student not found'));
    }

    return student.learningProfile;
  },

  getAllStudents: async (userId: string): Promise<UserDTO[]> => {
    return userService.getAllStudents(userId);
  },
};
