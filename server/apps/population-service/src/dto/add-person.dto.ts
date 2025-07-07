import { IsEmail, IsObject, IsString } from "class-validator";


export class addPersonDto{
    
    @IsString()
    @IsEmail()
    email:string;


    @IsString()
    phone:string;

    @IsString()
    name:string;


    @IsObject()
    customFields: Record<string, number | string | Date | boolean>;
}