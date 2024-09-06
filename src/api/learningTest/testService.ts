import { testRepository } from '@/api/learningTest/testRepository';
import { LearningProfile } from '@/common/models/learningProfile';
import { calculateLearningProfile } from '@/common/utils/kolbTest';

export const testService = {
  processAnswers: async (studentUserId: string, answers: number[][]): Promise<LearningProfile> => {
    // Almacenar las respuestas completas en la base de datos
    await testRepository.saveAnswers(studentUserId, answers);

    // Calcular el perfil de aprendizaje utilizando la matriz de respuestas
    const profile = calculateLearningProfile(answers);

    // Guardar el perfil de aprendizaje en la base de datos
    await testRepository.saveProfile(studentUserId, profile);

    return profile;
  },
};
