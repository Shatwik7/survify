import { JwtService } from '@nestjs/jwt';
import { UserService, QuestionnaireDBService, PopulationDBService, PersonDBService, SurveyService, SurveyAccessService } from '@app/database';

export interface TestData {
  user: any;
  questionnaire: any;
  population: any;
  person: any;
  survey: any;
  surveyJwt: string;
}

export class SurveyTestFactory {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly questionnaireDBService: QuestionnaireDBService,
    private readonly populationDBService: PopulationDBService,
    private readonly personDBService: PersonDBService,
    private readonly surveyService: SurveyService,
    private readonly surveyAccessService: SurveyAccessService,
  ) {}

  async createTestData(overrides: Partial<TestData> = {}): Promise<TestData> {
    // Create test user
    const user = overrides.user || await this.userService.createNewUser({
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      password: 'password123',
    });

    // Create test questionnaire
    const questionnaire = overrides.questionnaire || await this.questionnaireDBService.addQuestionnaire(
      'Test Questionnaire',
      'Test Description',
      'completed',
      user.id
    );

    // Add questions to questionnaire
    await this.questionnaireDBService.addMultipleQuestionsToQuestionnaire(
      questionnaire.id,
      [
        {
          description: 'What is your name?',
          type: 'text',
        },
        {
          description: 'How old are you?',
          type: 'number',
        },
        {
          description: 'What is your favorite color?',
          type: 'select',
          options: ['Red', 'Blue', 'Green', 'Yellow'],
        },
        {
          description: 'Do you like surveys?',
          type: 'checkbox',
        },
        {
          description: 'When is your birthday?',
          type: 'date',
        },
      ]
    );

    // Create test population
    const population = overrides.population || await this.populationDBService.createPopulation(
      'Test Population',
      user.id
    );

    // Create test person (ensure population is not empty before creating survey)
    const person = overrides.person || await this.personDBService.addPersonToPopulation(
      {
        email: `person-${Date.now()}@example.com`,
        name: 'Test Person',
        phone: '1234567890',
        customFields: { department: 'Engineering' },
      },
      population.id
    );

    // Create test survey
    const survey = overrides.survey || await this.surveyService.createSurvey({
      questionnaireId: questionnaire.id,
      populationId: population.id,
      userId: user.id,
      deliveryModes: ['email', 'whatsapp'],
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    });

    // Generate survey JWT
    const surveyJwt = overrides.surveyJwt || this.jwtService.sign(
      {
        surveyId: survey.id,
        personId: person.id,
        type: 'survey-access',
      },
      {
        expiresIn: '30d',
      }
    );

    // Create survey access record
    await this.surveyAccessService.createAccess(survey.id, person.id, surveyJwt);

    return {
      user,
      questionnaire,
      population,
      person,
      survey,
      surveyJwt,
    };
  }

  async createExpiredSurvey(): Promise<TestData> {
    const baseData = await this.createTestData();
    
    // Create expired survey
    const expiredSurvey = await this.surveyService.createSurvey({
      questionnaireId: baseData.questionnaire.id,
      populationId: baseData.population.id,
      userId:baseData.user.id,
      deliveryModes: ['email'],
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
    });

    const expiredJwt = this.jwtService.sign(
      {
        surveyId: expiredSurvey.id,
        personId: baseData.person.id,
        type: 'survey-access',
      },
      { expiresIn: '30d' }
    );

    await this.surveyAccessService.createAccess(expiredSurvey.id, baseData.person.id, expiredJwt);

    return {
      ...baseData,
      survey: expiredSurvey,
      surveyJwt: expiredJwt,
    };
  }

  async createMultiplePersons(count: number = 5): Promise<TestData> {
    const baseData = await this.createTestData();

    // Add multiple persons to population
    for (let i = 0; i < count; i++) {
      await this.personDBService.addPersonToPopulation(
        {
          email: `person${i}-${Date.now()}@example.com`,
          name: `Test Person ${i}`,
          phone: `123456789${i}`,
          customFields: { department: 'Engineering', level: i },
        },
        baseData.population.id
      );
    }

    return baseData;
  }

  async cleanupTestData(testData: TestData): Promise<void> {
    try {
      if (testData.survey) {
        // Note: SurveyService doesn't have a remove method, so we'll skip survey cleanup
        // The survey will be cleaned up when population is deleted due to cascade
      }
      if (testData.population) {
        await this.populationDBService.deletePopulation(testData.population.id);
      }
      if (testData.questionnaire) {
        await this.questionnaireDBService.delete(testData.questionnaire.id);
      }
      if (testData.user) {
        await this.userService.delete(testData.user.id);
      }
    } catch (error) {
      console.warn('Error during test cleanup:', error.message);
    }
  }

  generateUserJwt(user: any): string {
    return this.jwtService.sign({ id: user.id, email: user.email });
  }

  generateInvalidJwt(): string {
    return 'invalid.jwt.token';
  }

  generateExpiredJwt(): string {
    return this.jwtService.sign(
      { test: 'data' },
      { expiresIn: '1ms' }
    );
  }
} 