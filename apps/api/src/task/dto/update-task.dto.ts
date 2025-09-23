import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';
import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class UpdateTaskDto extends PartialType(CreateTaskDto){
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @IsNumber()
  @IsOptional()
  assignedToId?: number;

  @IsNumber()
  @IsOptional()
  organizationId?: number;
}
