import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @IsNumber()
  @IsOptional()
  assignedToId?: number; // ID of User

  @IsNumber()
  organizationId: number; // ID of Organization
}
