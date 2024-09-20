import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import { directorRepository } from '@/api/director/directorRepository';
import { TeacherModel } from '@/api/teacher/teacherModel';
import { UserCreationDTO, UserDTO } from '@/api/user/userModel';
import sendMailTo from '@/common/mailSender/mailSenderService';
import { Role } from '@/common/models/role';
import { config } from '@/common/utils/config';
import { logger } from '@/common/utils/serverLogger';

import { userService } from '../user/userService';

// TODO: Reimplementar para no repetir
export const teacherService = {
  create: async (user: UserCreationDTO, directorUserId: string): Promise<UserDTO> => {
    logger.trace('[TeacherService] - [create] - Start');
    logger.trace(`[TeacherService] - [create] - Creating teacher: ${JSON.stringify(user)}`);
    logger.trace(`[TeacherService] - [create] - Generating random password...`);
    const randomPassword = crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
    console.log('TEACHER PASS:', randomPassword);
    if (config.app.node_env === 'development') {
      logger.trace(`[TeacherService] - [create] - Random password: ${randomPassword}`);
    }
    logger.trace(`[TeacherService] - [create] - Hashing password...`);
    const hash = await bcrypt.hash(randomPassword, 10);
    logger.trace(`[TeacherService] - [create] - Password hashed.`);
    logger.trace(`[TeacherService] - [create] - Creating teacher...`);
    const createdUser: UserDTO = await userService.create({ ...user, password: hash, role: Role.TEACHER });
    logger.trace(`[TeacherService] - [create] - Teacher created: ${JSON.stringify(createdUser)}`);

    const instituteId = await directorRepository.getInstituteId(directorUserId);
    console.log(instituteId);
    const teacher = new TeacherModel({
      user: createdUser.id,
      institute: instituteId,
      courses: [],
    });

    await teacher.save();

    logger.trace(`[TeacherService] - [create] - Sending email to teacher ${createdUser.email}...`);
    const token = jwt.sign({ id: createdUser.id }, config.jwt.secret as string, { expiresIn: '12h' });
    sendMailTo({
      to: [createdUser.email],
      subject: 'Bienvenido a AdaptarIA!',
      bodyTemplateName: 'teacher_welcome',
      templateParams: {
        teacherName: createdUser.firstName,
        teacherEmail: createdUser.email,
        teacherInstitute: instituteId,
        reset_password_link: `${config.app.frontendUrl}/recoverPassword?token=${token}`,
      },
    });
    logger.trace(`[TeacherService] - [create] - Email sent.`);
    logger.trace('[TeacherService] - [create] - End');
    return createdUser;
  },

  createMultiple: async (teachers: UserCreationDTO[], directorUserId: string): Promise<UserDTO[]> => {
    logger.trace('[StudentService] - [createMultiple] - Start');
    const createdTeachers: UserDTO[] = [];

    for (const user of teachers) {
      const createdUser: UserDTO = await teacherService.create(user, directorUserId);

      logger.trace(`[StudentService] - [createMultiple] - Student created: ${JSON.stringify(createdUser)}`);
      createdTeachers.push(createdUser);
    }

    logger.trace('[StudentService] - [createMultiple] - All students created successfully');
    return createdTeachers;
  },

  findByInstituteId: async (instituteId: string): Promise<UserDTO[]> => {
    logger.trace('[TeacherService] - [findByInstituteId] - Start');
    logger.trace(`[TeacherService] - [findByInstituteId] - Searching for teachers in institute ${instituteId}`);
    const teachers = await TeacherModel.find({ institute: instituteId }).populate('user').exec();
    logger.trace(`[TeacherService] - [findByInstituteId] - Found ${teachers.length} teachers`);
    logger.trace('[TeacherService] - [findByInstituteId] - End');
    return teachers.map((teacher) => (teacher as any).user.toDto());
  },
};
