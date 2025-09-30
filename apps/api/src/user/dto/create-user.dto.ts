import { IsString, IsNotEmpty, MinLength, IsOptional, IsNumber } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsNumber()
  @IsOptional()
  roleId?: number;

  @IsNumber()
  @IsOptional()
  organizationId?: number;
}
