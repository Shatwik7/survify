import { IsString } from "class-validator";



export class CreateUsingOpenAI{
    @IsString()
    title: string;

    @IsString()
    description: string;


    @IsString()
    prompt: string;
}