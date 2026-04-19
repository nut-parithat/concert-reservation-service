import { UserRole } from '../../users/entities/user.entity';

export class UserResponseDto {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export class AuthResponseDto {
  token: string;
  user: UserResponseDto;
}
