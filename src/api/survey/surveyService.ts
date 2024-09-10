import { StudentSurveyModel, TeacherSurveyModel } from '@/api/survey/surveyModel';

export const surveyService = {
  createStudentSurvey: async (userId: string, answers: number[], free?: string) => {
    const survey = new StudentSurveyModel({
      userId: userId,
      answers: answers,
      free: free,
    });

    await survey.save();
    return survey.toDto();
  },

  createTeacherSurvey: async (userId: string, answers: number[], free?: string) => {
    const survey = new TeacherSurveyModel({
      userId: userId,
      answers: answers,
      free: free,
    });

    await survey.save();
    return survey.toDto();
  },
};
