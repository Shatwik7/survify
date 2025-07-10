
import axios from 'axios';
import type { 
  User, 
  Questionnaire, 
  CreateQuestionnaireDto, 
  CreateQuestionDto, 
  CreateUsingOpenAI,
  SignUpDto,
  SignInDto,
  AuthResponse,
  Person,
  Population,
  Survey,
  SurveyStats,
  SubmitAnswersDto,
  Question,
  Answer,
  SurveyJobStatus,
  SendSurveyResponse
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ||  '/api';
console.log(API_BASE);
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async signUp(data: SignUpDto): Promise<Partial<User>> {
    const response = await api.post('/signup', data);
    return response.data;
  },

  async signIn(data: SignInDto): Promise<AuthResponse> {
    const response = await api.post('/signin', data);
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/me');
    return response.data;
  },

  async deleteProfile(): Promise<{ success: boolean }> {
    const response = await api.delete('/me');
    return response.data;
  },
};

export const questionnaireService = {
  async create(data: CreateQuestionnaireDto): Promise<Questionnaire> {
    const response = await api.post('/questionnaire', data);
    return response.data;
  },

  async getAll(): Promise<Questionnaire[]> {
    const response = await api.get('/questionnaire');
    return response.data;
  },

  async getById(id: string): Promise<Questionnaire> {
    const response = await api.get(`/questionnaire/${id}`);
    return response.data;
  },

  async update(id: string, data: Partial<Questionnaire>): Promise<Questionnaire> {
    const response = await api.patch(`/questionnaire/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/questionnaire/${id}`);
    return response.data;
  },

  async addQuestion(id: string, question: CreateQuestionDto): Promise<Questionnaire> {
    const response = await api.post(`/questionnaire/${id}/question`, question);
    return response.data;
  },

  async addQuestions(id: string, questions: CreateQuestionDto[]): Promise<Questionnaire> {
    const response = await api.post(`/questionnaire/${id}/questions`, questions);
    return response.data;
  },

  async createUsingAI(data: CreateUsingOpenAI): Promise<Questionnaire> {
    const response = await api.post('/questionnaire/UsingAI', data);
    return response.data;
  },

  async updateQuestion(questionnaireId: string, questionId: string, data: Partial<CreateQuestionDto>): Promise<Questionnaire> {
    const response = await api.patch(`/questionnaire/${questionnaireId}/question/${questionId}`, data);
    return response.data;
  },

  async deleteQuestion(questionnaireId: string, questionId: string): Promise<Questionnaire | null> {
    const response = await api.delete(`/questionnaire/${questionnaireId}/question/${questionId}`);
    return response.data;
  },
};

export const populationService = {
  async create(data: { name: string }): Promise<Population> {
    const response = await api.post('/population', data);
    return response.data;
  },

  async getAll(): Promise<Population[]> {
    const response = await api.get('/population');
    return response.data;
  },

  async getById(id: string): Promise<Population> {
    const response = await api.get(`/population/${id}`);
    return response.data;
  },

  async getWithPersons(id: string, page: number = 1, limit: number = 50): Promise<{
    population: Population;
    total: number;
    persons: Person[];
  }> {
    const response = await api.get(`/population/${id}/person?page=${page}&limit=${limit}`);
    return response.data;
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/population/${id}`);
    return response.data;
  },

  async uploadFile(populationId: string, file: File): Promise<Population> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/population/${populationId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async addPerson(populationId: string, person: {
    email: string;
    phone: string;
    name: string;
    customFields: Record<string, any>;
  }): Promise<Person> {
    const response = await api.post(`/population/${populationId}/addPerson`, person);
    return response.data;
  },

  async deletePerson(populationId: string, personId: string): Promise<void> {
    const response = await api.delete(`/population/${populationId}/person/${personId}`);
    return response.data;
  },

  async updatePerson(populationId: string, personId: string, person: {
    email?: string;
    phone?: string;
    name?: string;
    customFields?: Record<string, any>;
  }): Promise<boolean> {
    const response = await api.put(`/population/${populationId}/person/${personId}`, person);
    return response.data;
  },

  async createSegment(data: {
    parentPopulationId: string;
    segmentName: string;
    filter: any;
  }): Promise<{ data: any; jobId: string; progress: number }> {
    const response = await api.post('/population/createsegmentaion', data);
    return response.data;
  },

  async filterPopulation(
    populationId: string,
    filters: any,
    page: number = 1,
    limit: number = 50
  ): Promise<Person[]> {
    const response = await api.post(`/population/${populationId}/segment?page=${page}&limit=${limit}`, filters);
    return response.data;
  },

  async getJobStatus(jobId: string): Promise<{
    progress: number;
    finishedOn?: number;
    processedOn?: number;
  }> {
    const response = await api.get(`/population/getJobStatus/${jobId}`);
    return response.data;
  },

  async removeJob(jobId: string): Promise<number> {
    const response = await api.get(`/population/removeJob/${jobId}`);
    return response.data;
  },
};

export const surveyService = {
  async create(data: {
    questionnaireId: string;
    populationId: string;
    deliveryModes: ('email' | 'whatsapp')[];
    expiresAt: string;
  }): Promise<Survey> {
    const response = await api.post('/survey', data);
    return response.data;
  },

  async getAll(): Promise<Survey[]> {
    const response = await api.get('/survey');
    return response.data;
  },

  async getById(id: string): Promise<Survey> {
    const response = await api.get(`/survey/${id}`);
    return response.data;
  },

  async sendSurveyLinks(id: string): Promise<SendSurveyResponse> {
    const response = await api.post(`/survey/${id}/send`);
    return response.data;
  },

  async getSurveyJobStatus(id: string): Promise<SurveyJobStatus> {
    const response = await api.get(`/survey/${id}/job-status`);
    return response.data;
  },

  async getStats(id: string): Promise<SurveyStats> {
    const response = await api.get(`/survey/${id}/stats`);
    return response.data;
  },

  async getSurveyWithQuestions(jwt: string): Promise<{
    surveyId: string;
    questionnaire: {
      id: string;
      title: string;
      description?: string;
      questions: Question[];
    };
  }> {
    const response = await api.get(`/survey/questions/${jwt}`);
    return response.data;
  },

  async submitAnswers(data: SubmitAnswersDto): Promise<void> {
    const response = await api.post('/survey/submit', data);
    return response.data;
  },

  async getAnswers(id: string, page: number = 1, limit: number = 50): Promise<Answer[]> {
    const response = await api.get(`/survey/${id}/answers?page=${page}&limit=${limit}`);
    return response.data;
  },

  async downloadAnswers(id: string): Promise<Blob> {
    const response = await api.get(`/survey/${id}/answers/export`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default api;
