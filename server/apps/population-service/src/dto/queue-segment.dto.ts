import { Population } from "@app/database";
import { FilterGroup } from "./filter.types";
import { IsNumber, IsPositive, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";


export class QueueSegmentDto {

    @ValidateNested({ each: true })
    @Type(() => Population)
    fromPopulation: Population;


    @ValidateNested({ each: true })
    @Type(() => Population)
    toPopulation: Population;

    @ValidateNested({ each: true })
    @Type(() => FilterGroup)
    filter: FilterGroup;

    @IsString()
    userId:string;

    @IsNumber()
    @IsPositive()
    lastSuccessfulPage:number;

    @IsNumber()
    total:number;
}