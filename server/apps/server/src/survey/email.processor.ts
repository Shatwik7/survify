import { Process, Processor, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';
import * as nodemailer from 'nodemailer';
import { PersonDBService, PopulationDBService, SurveyAccessService, SurveyService } from '@app/database';
import { JwtService } from '@nestjs/jwt';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';

interface EmailJobData {
  surveyId: string;
  populationId: string;
  deliveryModes: ('email' | 'whatsapp')[];
  surveyTitle: string;
  page?: number;
  lastProcessedIndex?: number;
  totalPersons?: number;
  pageSize?: number;
}

@Processor('email-service')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private configService: ConfigService,
    private personDBService: PersonDBService,
    private populationDBService: PopulationDBService,
    private surveyAccessService: SurveyAccessService,
    private surveyDBService: SurveyService,
    private jwtService: JwtService,
    @InjectQueue('email-service') private emailQueue: Queue,
  ) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const gmailUser = this.configService.get('GMAIL_USER');
    const gmailPassword = this.configService.get('GMAIL_PASSWORD');
    const gmailAppPassword = this.configService.get('GMAIL_APP_PASSWORD');

    if (!gmailUser || (!gmailPassword && !gmailAppPassword)) {
      this.logger.warn('Gmail credentials not configured. Emails will be logged only.');
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword || gmailPassword,
      },
    });

    this.logger.log('Gmail transporter initialized successfully');
  }

  @Process({ name: 'send-survey-emails', concurrency: 1 })
  async handleSendSurveyEmails(job: Job<EmailJobData>) {
    const {
      surveyId,
      populationId,
      deliveryModes,
      surveyTitle,
      page = 1,
      lastProcessedIndex = 0,
      totalPersons = 0,
      pageSize = 100
    } = job.data;

    this.logger.log(`Processing emails for survey: ${surveyTitle} - Population: ${populationId} - Page: ${page}`);

    try {

      if (page === 1) {
        await this.surveyDBService.updateSendJobStatus(surveyId, 'Processing', job.id.toString());
      }
      let total = totalPersons;
      if (page === 1) {
        const populationData = await this.populationDBService.getPopulationWithPersons(populationId, 1, 1);
        if (!populationData) {
          throw new Error('Population not found');
        }
        total = populationData.total;
        await job.update({ ...job.data, totalPersons: total });
        this.logger.log(`Total persons in population: ${total}`);
      }

      const { data: persons, hasNextPage } = await this.personDBService.fetchPersonsFromPopulationInPages(
        populationId,
        page,
        pageSize
      );

      this.logger.log(`Fetched ${persons.length} persons for page ${page}`);
      for (let i = 0; i < persons.length; i++) {
        const person = persons[i];
        const currentIndex = lastProcessedIndex + i;

        try {
          const existingAccesses = await this.surveyAccessService.getAccessBySurvey(surveyId);
          const existingAccess = existingAccesses.find(access => access.personId === person.id);

          if (!existingAccess) {
            const jwtToken = this.generateSurveyJWT(surveyId, person.id);
            await this.surveyAccessService.createAccess(surveyId, person.id, jwtToken);
            if (deliveryModes.includes('email')) {
              await this.sendEmail(person.email, person.name || 'there', jwtToken, surveyTitle);
            }
            if (deliveryModes.includes('whatsapp') && person.phone) {
              await this.sendWhatsApp(person.phone, person.name || 'there', jwtToken, surveyTitle);
            }
            this.logger.log(`Successfully processed person ${person.email} (${currentIndex + 1}/${total})`);
          } else {
            this.logger.log(`Access record already exists for person ${person.email}`);
          }
          const progress = Math.floor(((currentIndex + 1) / total) * 100);
          await job.progress(progress);

          await this.surveyDBService.updateSendJobStatus(surveyId, 'Processing', undefined, progress);

        } catch (error) {
          this.logger.error(`Failed to process person ${person.email}:`, error);
        }
      }

      const newLastProcessedIndex = lastProcessedIndex + persons.length;
      await job.update({
        ...job.data,
        lastProcessedIndex: newLastProcessedIndex
      });

      if (hasNextPage) {
        const nextPage = page + 1;
        this.logger.log(`Creating job for next page: ${nextPage}`);

        await this.emailQueue.add('send-survey-emails', {
          surveyId,
          populationId,
          deliveryModes,
          surveyTitle,
          page: nextPage,
          lastProcessedIndex: newLastProcessedIndex,
          totalPersons: total,
          pageSize
        }, {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 30000,
          },
        });
      } else {
        this.logger.log(`Completed sending emails for all persons in population ${populationId}`);
        await this.surveyDBService.updateSendJobStatus(surveyId, 'Completed', undefined, 100);
      }

    } catch (error) {
      this.logger.error(`Failed to process email job for survey ${surveyId}:`, error);
      // Update status to Failed
      await this.surveyDBService.updateSendJobStatus(surveyId, 'Failed');
      throw error;
    }
  }

  private generateSurveyJWT(surveyId: string, personId: string): string {
    return this.jwtService.sign({
      surveyId,
      personId,
      type: 'survey-access'
    }, {
      expiresIn: '30d' // Survey access token expires in 30 days
    });
  }

  private async sendEmail(email: string, name: string, jwtToken: string, surveyTitle: string): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost';
    const surveyUrl = `${frontendUrl}/survey/${jwtToken}`;

    const emailContent = {
      from: this.configService.get('GMAIL_USER') || 'noreply@survey.com',
      to: email,
      subject: `Survey Invitation: ${surveyTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Hello ${name || 'there'}!</h2>
          <p>You have been invited to participate in a survey: <strong>${surveyTitle}</strong></p>
          <p>Please click the button below to access the survey:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${surveyUrl}" style="padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
              Take Survey
            </a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${surveyUrl}</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">Thank you for your participation!</p>
        </div>
      `
    };

    if (this.transporter) {
      try {
        await this.transporter.sendMail(emailContent);
        this.logger.log(`Email sent successfully to ${email}`);
      } catch (error) {
        this.logger.error(`Failed to send email to ${email}:`, error);
        throw error;
      }
    } else {
      this.logger.log(`Email would be sent to ${email}:`, {
        to: email,
        subject: emailContent.subject,
        surveyUrl,
        surveyTitle
      });
    }
  }

  private async sendWhatsApp(phone: string, name: string, jwtToken: string, surveyTitle: string): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost';
    const surveyUrl = `${frontendUrl}/survey/${jwtToken}`;

    const message = `Hello ${name || 'there'}! You have been invited to participate in a survey: ${surveyTitle}. Please click this link: ${surveyUrl}`;

    this.logger.log(`Would send WhatsApp to ${phone}: ${message}`);

    // TODO: Integrate with actual WhatsApp service
    // await this.whatsappService.send(phone, message);
  }

  @OnQueueCompleted({ name: 'send-survey-emails' })
  async onCompleted(job: Job<EmailJobData>) {
    const { surveyId } = job.data;
    this.logger.log(`Email job completed for survey: ${surveyId}`);

    // Check if this was the last page (no more pages to process)
    const { page = 1, totalPersons = 0, lastProcessedIndex = 0, pageSize = 100 } = job.data;
    const totalProcessed = lastProcessedIndex + (pageSize * (page - 1));

    if (totalProcessed >= totalPersons) {
      await this.surveyDBService.updateSendJobStatus(surveyId, 'Completed', undefined, 100);
      this.logger.log(`All emails completed for survey: ${surveyId}`);
    }
  }

  @OnQueueFailed({ name: 'send-survey-emails' })
  async onFailed(job: Job<EmailJobData>, error: Error) {
    const { surveyId } = job.data;
    this.logger.error(`Email job failed for survey: ${surveyId}`, error);

    // Update status to Failed
    await this.surveyDBService.updateSendJobStatus(surveyId, 'Failed');
  }
} 