import { Types } from 'mongoose';

import { Teacher, TeacherModel } from '@/api/teacher/teacherModel';

export const teacherRepository = {
  addCourseToTeacher: async (
    teacherUserId: string,
    course: { id: Types.ObjectId; courseName: string }
  ): Promise<void> => {
    await TeacherModel.updateOne({ user: teacherUserId }, { $push: { courses: course } }).exec();
  },

  findByUserIdAsync: async (teacherUserId: string): Promise<any> => {
    const teacher = await TeacherModel.findOne<Teacher>({ user: teacherUserId }).exec();
    if (!teacher) {
      throw new Error('Teacher not found');
    }
    return teacher;
  },

  findByInstituteId: async (instituteId: string): Promise<Teacher[]> => {
    return TeacherModel.find({ institute: instituteId }).populate('user').exec();
  },

  getInstituteId: async (teacherUserId: string): Promise<string> => {
    const teacher = await teacherRepository.findByUserIdAsync(teacherUserId);
    return teacher.institute.toString();
  },
};
