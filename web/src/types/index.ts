export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'radio';
  options?: string[];
}

export interface Questionnaire {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'queued' | 'completed' | 'failed';
  questions: Question[];
  createdAt: string;
  updatedAt: string;
  prompt?: string;
}

export interface CreateQuestionnaireDto {
  title: string;
  description: string;
}

export interface CreateQuestionDto {
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'radio';
  options?: string[];
}

export interface CreateUsingOpenAI {
  title: string;
  description: string;
  prompt: string;
}

export interface SignUpDto {
  email: string;
  password: string;
  name: string;
}

export interface SignInDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
}

export interface ExcelQuestionRow {
  serialNo: number;
  description: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'radio';
  option_1?: string;
  option_2?: string;
  option_3?: string;
  option_4?: string;
  option_5?: string;
}

export interface Person {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Population {
  id: string;
  name: string;
  status: 'completed' | 'queued' | 'working' | 'failed';
  persons?: Person[];
  jobId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Survey {
  id: string;
  questionnaireId: string;
  populationId: string;
  userId: string;
  deliveryModes: ('email' | 'whatsapp')[];
  expiresAt: string;
  analyzed: boolean;
  sendJobStatus: 'NotStarted' | 'Queued' | 'Processing' | 'Completed' | 'Failed';
  sendJobId?: string;
  sendProgress: number;
  sendJobStartedAt?: string;
  sendJobCompletedAt?: string;
  createdAt: string;
  updatedAt: string;
  questionnaire?: Questionnaire;
  population?: Population;
  user?: User;
}

export interface SurveyJobStatus {
  sendJobStatus: 'NotStarted' | 'Queued' | 'Processing' | 'Completed' | 'Failed';
  sendJobId?: string;
  sendProgress: number;
  sendJobStartedAt?: string;
  sendJobCompletedAt?: string;
}

export interface SendSurveyResponse {
  sendJobStatus: 'Queued';
  sendJobId: string;
  sendProgress: number;
  sendJobStartedAt: string;
  sendJobCompletedAt?: string;
}

export interface CreateSurveyDto {
  questionnaireId: string;
  populationId: string;
  deliveryModes: ('email' | 'whatsapp')[];
  expiresAt: string;
}

export interface SurveyStats {
  total: number;
  seen: number;
  completed: number;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  personId: string;
  answers: Record<string, any>;
  submittedAt: string;
  person?: Person;
}

export interface SubmitAnswersDto {
  jwt: string;
  answers: { [questionId: string]: string[] };
}

export interface Answer {
  answer_id: string;
  answer: string | string[];
  answered_at: string;
  person_email: string;
  question: string;
  question_type: string;
}
