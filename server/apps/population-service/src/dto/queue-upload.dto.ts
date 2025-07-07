import { Population } from "@app/database";
import { Type } from "class-transformer";
import { IsNumber, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";


export class QueueUploadDto {

    @IsString()
    filePath: string;

    @ValidateNested({ each: true })
    @Type(() => Population)
    population:Population;

    @IsNumber()
    lastRow:number=0;

    @IsString()
    userId:string;

    @IsNumber()
    @IsOptional()
    total:number;
}