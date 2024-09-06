import { StudentModel } from '@/api/student/studentModel';

import { TestModel } from './testModel';

export const testRepository = {
  // Guarda la matriz completa de respuestas para un estudiante
  async saveAnswers(studentUserId: string, answers: number[][]): Promise<void> {
    // Busca si ya existe un test para el usuario
    const existingTest = await TestModel.findOne({ userId: studentUserId });

    if (existingTest) {
      // Si existe, actualiza el test con los nuevos valores
      existingTest.answers = answers;
      await existingTest.save();
    } else {
      // Si no existe, crea uno nuevo
      const newTest = new TestModel({
        userId: studentUserId,
        answers: answers,
      });
      await newTest.save();
    }
  },
  // Actualiza el perfil de un estudiante
  async saveProfile(studentUserId: string, profile: string): Promise<void> {
    await StudentModel.updateOne({ user: studentUserId }, { learningProfile: profile }).exec();
  },
};
