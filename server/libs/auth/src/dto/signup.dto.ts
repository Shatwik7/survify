import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';


export class SignUpDto {
    @IsString()
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsString()
    @IsNotEmpty()
    name: string;
}