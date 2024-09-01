import bcrypt from 'bcrypt';
import crypto from 'crypto';

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
    sendMailTo(
      [createdUser.email],
      'Welcome to the school',
      `<h1>Welcome to the school</h1>
      <p>You have been registered as a teacher in the school.
      Your username is ${createdUser.email} and your password is ${randomPassword}.
      Please login and change your password.</p>`
    );
    logger.trace(`[TeacherService] - [create] - Email sent.`);
    logger.trace('[TeacherService] - [create] - End');
    return createdUser;
  },

  findByInstituteId: async (instituteId: string): Promise<UserDTO[]> => {
    logger.trace('[TeacherService] - [findByInstituteId] - Start');
    logger.trace(`[TeacherService] - [findByInstituteId] - Searching for teachers in institute ${instituteId}`);
    const teachers = await TeacherModel.find({ instituteId: instituteId }).exec();
    logger.trace(`[TeacherService] - [findByInstituteId] - Found ${teachers.length} teachers`);
    // TODO: Put instituteId in the USER
    const teacherIds = teachers.map((teacher) => teacher.user.id);
    const teacherUsersPromises = teacherIds.map((teacherId) => userService.findById(teacherId));
    const teachersUsers = await Promise.all(teacherUsersPromises);
    logger.trace('[TeacherService] - [findByInstituteId] - End');
    return teachersUsers;
  },
};
