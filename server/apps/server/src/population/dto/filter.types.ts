import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

export class Condition {
  @IsString()
  @IsNotEmpty()
  field: string;

  @IsIn(['=', '!=', '>', '>=', '<', '<='])
  operator: '=' | '!=' | '>' | '>=' | '<' | '<=';

  @IsIn(['string', 'number', 'boolean', 'date'])
  type: 'string' | 'number' | 'boolean' | 'date';

  @IsOptional()
  value: any;
}

export class FilterGroup {
  @IsIn(['AND', 'OR'], { message: 'Logic must be either AND or OR' })
  logic: 'AND' | 'OR';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Condition)
  conditions: (Condition | FilterGroup)[];
}