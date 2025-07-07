import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Question } from "../entities/question.entity";
import { Questionnaire } from "../entities/questionnaire.entity";
import { User } from "../entities/user.entity";

@Injectable()
export class QuestionDBService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,

    @InjectRepository(Questionnaire)
    private readonly questionnaireRepo: Repository<Questionnaire>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findById(id: string): Promise<Question | null> {
    return this.questionRepo.findOne({ where: { id } });
  }

  async findAll(): Promise<Question[]> {
    return this.questionRepo.find({ relations: ['questionnaire', 'createdBy'] });
  }

  // async create(input: {
  //   description: string;
  //   imageUrl: string | null;
  //   videoUrl: string | null;
  //   type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'radio';
  //   options?: string[];
  //   questionnaireId: string;
  //   createdById: string;
  // }): Promise<Question> {
  //   const questionnaire = await this.questionnaireRepo.findOne({
  //     where: { id: input.questionnaireId },
  //   });
  //   if (!questionnaire) throw new NotFoundException('Questionnaire not found');

  //   const user = await this.userRepo.findOne({ where: { id: input.createdById } });
  //   if (!user) throw new NotFoundException('User (creator) not found');

  //   const question = this.questionRepo.create({
  //     description: input.description,
  //     imageUrl: input.imageUrl,
  //     videoUrl: input.videoUrl,
  //     type: input.type,
  //     options: input.options || [],
  //     questionnaire,
  //     createdBy: user,
  //   });

  //   return this.questionRepo.save(question);
  // }
}
