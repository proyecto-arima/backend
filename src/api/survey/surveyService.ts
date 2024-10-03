import { StudentModel } from '@/api/student/studentModel';
import { Percentages, ResponseCounts, StudentSurveyModel, TeacherSurveyModel } from '@/api/survey/surveyModel';

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

  // En surveyService
  findStudentSurveyByUserId: async (userId: string): Promise<any> => {
    return StudentSurveyModel.findOne({ userId }).exec();
  },

  findTeacherSurveyByUserId: async (userId: string): Promise<any> => {
    return TeacherSurveyModel.findOne({ userId }).exec();
  },

  calculateStudentsSurveyResults: async (
    courseId?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<Percentages> => {
    const surveyFilter: any = {};

    // Filtro por fechas (opcional)
    if (dateFrom && dateTo) {
      surveyFilter.createdAt = {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo),
      };
    } else if (dateFrom) {
      surveyFilter.createdAt = { $gte: new Date(dateFrom) };
    } else if (dateTo) {
      surveyFilter.createdAt = { $lte: new Date(dateTo) };
    }

    // Filtro por curso (opcional)
    if (courseId) {
      const studentsInCourse = await StudentModel.find({
        'courses.id': courseId,
      }).select('user'); // Solo necesitamos el campo user (userId)

      // Obtener los ids de los estudiantes en el curso
      const studentIds = studentsInCourse.map((student) => student.user);

      // Filtrar encuestas de estos estudiantes
      surveyFilter.userId = { $in: studentIds };
    }

    // Obtener las encuestas que coincidan con el filtro
    const surveys = await StudentSurveyModel.find(surveyFilter);

    const totalResponses = surveys.length;
    if (totalResponses === 0)
      return {
        question1: [0, 0, 0, 0, 0],
        question2: [0, 0, 0, 0, 0],
        question3: [0, 0, 0, 0, 0],
        question4: [0, 0, 0, 0, 0],
        question5: [0, 0, 0, 0, 0],
      };

    // Inicializar un objeto para contar respuestas
    const responseCounts: ResponseCounts = {
      question1: [0, 0, 0, 0, 0],
      question2: [0, 0, 0, 0, 0],
      question3: [0, 0, 0, 0, 0],
      question4: [0, 0, 0, 0, 0],
      question5: [0, 0, 0, 0, 0],
    };

    // Contar respuestas
    for (const survey of surveys) {
      survey.answers.forEach((answer, index) => {
        // Asegurarse de que el índice y la respuesta estén dentro de los rangos válidos
        if (index >= 0 && index < 5 && answer >= 1 && answer <= 5) {
          const questionKey = `question${index + 1}` as keyof ResponseCounts; // Asegurarse de que el índice es de tipo keyof ResponseCounts
          responseCounts[questionKey][answer - 1] += 1; // Incrementar el contador
        }
      });
    }

    // Calcular porcentajes
    const percentages: Percentages = {
      question1: [],
      question2: [],
      question3: [],
      question4: [],
      question5: [],
    };

    for (let i = 0; i < 5; i++) {
      const questionKey = `question${i + 1}` as keyof Percentages; // Asegurarse de que la clave es de tipo keyof Percentages
      percentages[questionKey] = responseCounts[questionKey].map((count) => {
        return (count / totalResponses) * 100; // Calcular el porcentaje
      });
    }

    return percentages; // Retornar los resultados
  },

  calculateTeachersSurveyResults: async (): Promise<Percentages> => {
    // Obtener todas las encuestas completadas
    const surveys = await TeacherSurveyModel.find({}); // Cambia a TeacherSurveyModel si es necesario

    const totalResponses = surveys.length;
    if (totalResponses === 0)
      return {
        question1: [0, 0, 0, 0, 0],
        question2: [0, 0, 0, 0, 0],
        question3: [0, 0, 0, 0, 0],
        question4: [0, 0, 0, 0, 0],
        question5: [0, 0, 0, 0, 0],
      };

    // Inicializar un objeto para contar respuestas
    const responseCounts: ResponseCounts = {
      question1: [0, 0, 0, 0, 0],
      question2: [0, 0, 0, 0, 0],
      question3: [0, 0, 0, 0, 0],
      question4: [0, 0, 0, 0, 0],
      question5: [0, 0, 0, 0, 0],
    };

    // Contar respuestas
    for (const survey of surveys) {
      survey.answers.forEach((answer, index) => {
        // Asegurarse de que el índice y la respuesta estén dentro de los rangos válidos
        if (index >= 0 && index < 5 && answer >= 1 && answer <= 5) {
          const questionKey = `question${index + 1}` as keyof ResponseCounts; // Asegurarse de que el índice es de tipo keyof ResponseCounts
          responseCounts[questionKey][answer - 1] += 1; // Incrementar el contador
        }
      });
    }

    // Calcular porcentajes
    const percentages: Percentages = {
      question1: [],
      question2: [],
      question3: [],
      question4: [],
      question5: [],
    };

    for (let i = 0; i < 5; i++) {
      const questionKey = `question${i + 1}` as keyof Percentages; // Asegurarse de que la clave es de tipo keyof Percentages
      percentages[questionKey] = responseCounts[questionKey].map((count) => {
        return (count / totalResponses) * 100; // Calcular el porcentaje
      });
    }

    return percentages; // Retornar los resultados
  },
};
