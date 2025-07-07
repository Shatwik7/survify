import { IsObject, IsString, ValidateNested } from "class-validator";
import { FilterGroup } from "./filter.types";
import { Type } from "class-transformer";



export class CreateSegmentDto {
    @IsString()
    parentPopulationId: string;

    @IsString()
    segmentName: string;

    
    @ValidateNested({ each: true })
    @Type(() => FilterGroup)
    filter: FilterGroup;
}