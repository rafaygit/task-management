import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsNumber()
  @IsOptional()
  roleId?: number;

  @IsNumber()
  @IsOptional()
  organizationId?: number;

  // Note: Password updates should be handled through a separate endpoint with proper validation
}
