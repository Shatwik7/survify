import { IsEmail, IsObject, IsOptional, IsString } from "class-validator";



export class UpdatePersonDto{

    @IsString()
    @IsEmail()
    @IsOptional()
    email:string;


    @IsString()
    @IsOptional()
    phone:string;

    @IsString()
    @IsOptional()
    name:string;


    @IsObject()
    @IsOptional()
    customFields: Record<string, number | string | Date | boolean>;
}