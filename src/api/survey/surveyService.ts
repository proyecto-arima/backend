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
    instituteId: string, // instituteId es obligatorio,
    courseId?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<Percentages | null> => {
    const surveyFilter: any = {};

    // Filtro por fechas (opcional)
    if (dateFrom && dateTo) {
      const startOfDateFrom = new Date(dateFrom);
      startOfDateFrom.setUTCHours(0, 0, 0, 0); // Inicio del día en UTC para dateFrom

      const endOfDateTo = new Date(dateTo);
      endOfDateTo.setUTCHours(23, 59, 59, 999); // Final del día en UTC para dateTo

      surveyFilter.updatedAt = {
        $gte: startOfDateFrom,
        $lte: endOfDateTo,
      };
    } else if (dateFrom) {
      const startOfDateFrom = new Date(dateFrom);
      startOfDateFrom.setUTCHours(0, 0, 0, 0); // Inicio del día en UTC para dateFrom
      surveyFilter.updatedAt = { $gte: startOfDateFrom };
    } else if (dateTo) {
      const endOfDateTo = new Date(dateTo);
      endOfDateTo.setUTCHours(23, 59, 59, 999); // Final del día en UTC para dateTo
      surveyFilter.updatedAt = { $lte: endOfDateTo };
    }

    // Filtro por curso (opcional)
    if (courseId) {
      const studentsInCourse = await StudentModel.find({
        'courses.id': courseId,
        institute: instituteId, // Filtrar también por instituteId
      }).select('user'); // Solo necesitamos el campo user (userId)

      // Obtener los ids de los estudiantes en el curso
      const studentIds = studentsInCourse.map((student) => student.user);

      // Filtrar encuestas de estos estudiantes
      surveyFilter.userId = { $in: studentIds };
    } else {
      // Si no se filtra por curso, buscar todos los estudiantes del instituto
      const studentsInInstitute = await StudentModel.find({
        institute: instituteId,
      }).select('user');

      const studentIds = studentsInInstitute.map((student) => student.user);
      surveyFilter.userId = { $in: studentIds };
    }

    // Obtener las encuestas que coincidan con el filtro
    const surveys = await StudentSurveyModel.find(surveyFilter);

    const totalResponses = surveys.length;
    if (totalResponses === 0) {
      return null;
    }

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
      question1: responseCounts.question1.map((count) => (count / totalResponses) * 100),
      question2: responseCounts.question2.map((count) => (count / totalResponses) * 100),
      question3: responseCounts.question3.map((count) => (count / totalResponses) * 100),
      question4: responseCounts.question4.map((count) => (count / totalResponses) * 100),
      question5: responseCounts.question5.map((count) => (count / totalResponses) * 100),
    };

    return percentages;
  },

  calculateTeachersSurveyResults: async (dateFrom?: string, dateTo?: string): Promise<Percentages | null> => {
    const surveyFilter: any = {};

    // Filtro por fechas (opcional)
    if (dateFrom && dateTo) {
      const startOfDateFrom = new Date(dateFrom);
      startOfDateFrom.setUTCHours(0, 0, 0, 0); // Inicio del día en UTC para dateFrom

      const endOfDateTo = new Date(dateTo);
      endOfDateTo.setUTCHours(23, 59, 59, 999); // Final del día en UTC para dateTo

      surveyFilter.updatedAt = {
        $gte: startOfDateFrom,
        $lte: endOfDateTo,
      };
    } else if (dateFrom) {
      const startOfDateFrom = new Date(dateFrom);
      startOfDateFrom.setUTCHours(0, 0, 0, 0); // Inicio del día en UTC para dateFrom
      surveyFilter.updatedAt = { $gte: startOfDateFrom };
    } else if (dateTo) {
      const endOfDateTo = new Date(dateTo);
      endOfDateTo.setUTCHours(23, 59, 59, 999); // Final del día en UTC para dateTo
      surveyFilter.updatedAt = { $lte: endOfDateTo };
    }

    // Obtener las encuestas que coincidan con el filtro
    const surveys = await TeacherSurveyModel.find(surveyFilter);

    const totalResponses = surveys.length;
    if (totalResponses === 0) {
      return null;
    }

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
