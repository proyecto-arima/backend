import { Types } from 'mongoose';

import { Student, StudentModel } from '@/api/student/studentModel';

export const studentRepository = {
  findById: async (id: string): Promise<Student | null> => {
    const student = await StudentModel.findById<Student>(id);
    if (!student) {
      return Promise.reject(new Error('student not found'));
    }
    return student;
  },

  addCourseToStudent: async (
    studentUserId: Types.ObjectId,
    course: { id: Types.ObjectId; courseName: string }
  ): Promise<void> => {
    await StudentModel.updateOne({ user: studentUserId }, { $push: { courses: course } }).exec();
  },
};
