import { Types } from 'mongoose';

import { TeacherModel } from '@/api/teacher/teacherModel';

export const teacherRepository = {
  addCourseToTeacher: async (
    teacherUserId: string,
    course: { id: Types.ObjectId; courseName: string }
  ): Promise<void> => {
    await TeacherModel.updateOne({ userId: teacherUserId }, { $push: { courses: course } }).exec();
  },
};
