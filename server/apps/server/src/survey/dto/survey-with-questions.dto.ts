import { QuestionType } from '@app/database';

export interface SurveyWithQuestionsDto {
  surveyId: string;
  questionnaire: {
    id: string;
    title: string;
    description:string;
    questions: {
      id: string;
      description: string;
      type: QuestionType;
      options?: string[];
    }[];
  };
} 