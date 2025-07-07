export const TestConfig = {
  // Database Configuration
  database: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'mydatabase_test',
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'test-jwt-secret',
    expiration: process.env.JWT_EXPIRATION || '1d',
  },

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },

  // Test Data Configuration
  testData: {
    defaultUser: {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
    },
    defaultQuestionnaire: {
      title: 'Test Questionnaire',
      description: 'Test Description',
      status: 'completed',
    },
    defaultPopulation: {
      name: 'Test Population',
    },
    defaultPerson: {
      email: 'person@example.com',
      name: 'Test Person',
      phone: '1234567890',
      customFields: { department: 'Engineering' },
    },
    defaultSurvey: {
      deliveryModes: ['email', 'whatsapp'],
      expiresInHours: 24,
    },
  },

  // Test Timeouts
  timeouts: {
    short: 5000,    // 5 seconds
    medium: 10000,  // 10 seconds
    long: 30000,    // 30 seconds
  },

  // Test URLs
  urls: {
    survey: '/survey',
    surveyQuestions: (jwt: string) => `/survey/questions/${jwt}`,
    surveyStats: (id: string) => `/survey/${id}/stats`,
    surveySend: (id: string) => `/survey/${id}/send`,
    surveySubmit: '/survey/submit',
  },

  // Test Headers
  headers: {
    json: { 'Content-Type': 'application/json' },
    authorization: (token: string) => ({ Authorization: `Bearer ${token}` }),
  },

  // Test Utilities
  utils: {
    generateEmail: (prefix: string = 'test') => `${prefix}-${Date.now()}@example.com`,
    generatePhone: () => `123456789${Math.floor(Math.random() * 10)}`,
    generateName: (prefix: string = 'Test') => `${prefix} User ${Date.now()}`,
    generateExpirationDate: (hoursFromNow: number = 24) => 
      new Date(Date.now() + hoursFromNow * 60 * 60 * 1000),
    generateExpiredDate: (hoursAgo: number = 24) => 
      new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
  },
}; 