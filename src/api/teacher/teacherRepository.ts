import { Types } from 'mongoose';

import { Teacher, TeacherModel } from '@/api/teacher/teacherModel';

export const teacherRepository = {
  addCourseToTeacher: async (
    teacherUserId: string,
    course: { id: Types.ObjectId; courseName: string }
  ): Promise<void> => {
    await TeacherModel.updateOne({ userId: teacherUserId }, { $push: { courses: course } }).exec();
  },

  findByUserIdAsync: async (teacherUserId: string): Promise<any> => {
    console.log(teacherUserId);
    const teacher = await TeacherModel.findOne<Teacher>({ userId: teacherUserId }).exec();
    if (!teacher) {
      throw new Error('Teacher not found');
    }
    return teacher;
  },

  findByInstituteId: async (instituteId: string): Promise<Teacher[]> => {
    return TeacherModel.find({ instituteId: instituteId }).populate('userId').exec();
  },
};
