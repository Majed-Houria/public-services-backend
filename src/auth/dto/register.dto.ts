import { IsEmail, IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  @IsOptional()
  lastName: string;

  @IsBoolean()
  isTechnician: boolean;

  @IsOptional()
  phone?: string;

  @IsOptional()
  address?: string;
}
