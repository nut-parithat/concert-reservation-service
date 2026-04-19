import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class SignUpDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;
}
