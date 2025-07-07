import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { QuestionnaireService } from '../questionnaire.service';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';
@Processor('openai-questionnare-generator')
export class PromptProcessor {

    private readonly logger = new Logger(PromptProcessor.name)

    constructor(
        private readonly QuestionnaireService: QuestionnaireService,
        private configService: ConfigService,
    ) { }

    @Process({ name: 'genrate', concurrency: os.cpus().length * 2 })
    async handleTranscode(job: Job) {
        this.logger.debug('Start generation');
        const a = job.data as { id: string, prompt: string }
        this.logger.debug(a);
        try {
            const questions = await this.generateSurveyQuestions(a.prompt);
            this.logger.debug('Generation Completed');
            this.logger.log('questions are:', questions);
            await this.QuestionnaireService.addQuestions(a.id, questions)
            await this.QuestionnaireService.changeStatusToCompleted(a.id);
        } catch (error) {
            this.logger.error('Error Genrating the questions\n\n', error);
        }


    }


    async generateSurveyQuestions(productPrompt: string): Promise<{ "description": string; "type": 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'radio'; "options"?: string[] }[]> {
        console.log("openai starts");
        const apiKey = this.configService.get<string>("AZURE_OPENAI_API_KEY"); //this.configService.get<string>("AZURE_OPENAI_API_KEY")
        const endpoint = this.configService.get<string>("AZURE_OPENAI_ENDPOINT");//this.configService.get<string>("AZURE_OPENAI_ENDPOINT");
        const apiVersion = this.configService.get<string>("AZURE_OPENAI_API_VERSION"); //this.configService.get<string>("AZURE_OPENAI_API_VERSION");
        const deploymentName = this.configService.get<string>("AZURE_OPENAI_DEPLOYMENT_NAME"); //this.configService.get<string>("AZURE_OPENAI_DEPLOYMENT_NAME");

        const url = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;

        const prompt = `Generate as 25+ survey questions as possible for a product described as: "${productPrompt}".Return only the questions as a JSON array of  
                                                {
                                                    "description": string;
                                                    "type": enum ('text' | 'number' | 'date' | 'select' | 'checkbox' | 'radio')
                                                    "options"?: string[] | null
                                                }`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey!,
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "system", content: `You are a helpful assistant that is going to take the details of a product / service and going to genrate a
                                                a set of question for a servay and give the answer only in a JSON formate give as
                                                 
                                                {
                                                    "description": string;
                                                    "type": enum ('text' | 'number' | 'date' | 'select' | 'checkbox' | 'radio')
                                                    "options"?: string[] | null
                                                }
                
                                                give the set of questions in a array of this object` },
                    { role: "user", content: prompt }
                ],
                max_tokens: 2000,
                temperature: 0.7
            }),
        });
        const result = await response.json();
        const content = result.choices[0].message.content;
        try {
            console.log(content);
            return JSON.parse(content);
        } catch {
            // fallback: try to extract JSON array from text
            const match = content.match(/\[.*\]/s);
            if (match) {
                return JSON.parse(match[0]);
            }
            throw new Error("Failed to parse questions from OpenAI response");
        }
    }
}