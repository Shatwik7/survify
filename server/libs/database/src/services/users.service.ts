import { Injectable } from "@nestjs/common";
import { User } from "../entities/user.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Questionnaire } from "../entities/questionnaire.entity";


@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    public UserRepo: Repository<User>,
  ) { 
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.UserRepo.findOne({
      where: { id: id },
      relations: ['questionnaires'],
    });
    if (!user) return null;
    if(user.questionnaires==undefined) user.questionnaires=[];
    if(user.populations==undefined) user.populations=[];
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    console.log("Finding user by email:", email);
    const timebeg=Date.now();
    const user = await this.UserRepo.findOne({
      where: { email:email },
    });
    console.log(Date.now()-timebeg);
    if (!user) return null;
    if(user.questionnaires==undefined) user.questionnaires=[];
    if(user.populations==undefined) user.populations=[];
    console.log("User found:", user);
    return user;
  }

  async createNewUser(user: {
    email: string,
    name: string,
    password: string,
  }): Promise<User> {
    const newUser = this.UserRepo.create({...user});
    return this.UserRepo.save(newUser);
  }

  async update(id: string, user: Partial<User>): Promise<boolean> {
    try {
      await this.UserRepo.update(id, user);
      return true;
    } catch (error) {
      console.error("Error updating user:", error);
      return false;
    }
  }

  async delete(id: string): Promise<boolean> {
    await this.UserRepo.delete(id);
    await this.findById(id).then((user) => {
      if (user) {
        return false;
      }
    });
    return true;
  }

  async findAll(): Promise<User[]> {
    return this.UserRepo.find();
  }


  async getQuestionnaires(id: string): Promise<Questionnaire[] | null> {
    const user = await this.UserRepo.findOne({
      where: { id: id },
      relations: ['questionnaires'],
    });
    if (!user) return null;
    return user.questionnaires;
  }
}