import { ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '../../users/entities/user.entity';

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    email: 'john@example.com',
    fullName: 'John Doe',
    role: UserRole.USER,
    passwordHash: '$2a$10$hashedpassword',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  }) as User;

const mockUsersService = () => ({
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
});

describe('AuthService', () => {
  let service: AuthService;
  let usersService: ReturnType<typeof mockUsersService>;
  let jwtService: ReturnType<typeof mockJwtService>;

  beforeEach(() => {
    usersService = mockUsersService();
    jwtService = mockJwtService();
    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
    );
  });

  describe('signUp', () => {
    it('should create user and return token', async () => {
      const user = makeUser();
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(user);

      const result = await service.signUp({
        email: 'john@example.com',
        password: 'secret123',
        fullName: 'John Doe',
        role: UserRole.USER,
      });

      expect(usersService.create).toHaveBeenCalled();
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.email).toBe('john@example.com');
    });

    it('should throw ConflictException when email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(makeUser());

      await expect(
        service.signUp({
          email: 'john@example.com',
          password: 'secret123',
          fullName: 'John Doe',
          role: UserRole.USER,
        }),
      ).rejects.toThrow(ConflictException);

      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return token when credentials are valid', async () => {
      const passwordHash = await bcrypt.hash('secret123', 10);
      const user = makeUser({ passwordHash });
      usersService.findByEmail.mockResolvedValue(user);

      const result = await service.login({
        email: 'john@example.com',
        password: 'secret123',
        role: UserRole.USER,
      });

      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.id).toBe('user-1');
    });

    it('should throw BadRequestException when email not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nobody@example.com',
          password: 'secret123',
          role: UserRole.USER,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when role does not match', async () => {
      usersService.findByEmail.mockResolvedValue(
        makeUser({ role: UserRole.ADMIN }),
      );

      await expect(
        service.login({
          email: 'john@example.com',
          password: 'secret123',
          role: UserRole.USER,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when password is wrong', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      usersService.findByEmail.mockResolvedValue(makeUser({ passwordHash }));

      await expect(
        service.login({
          email: 'john@example.com',
          password: 'wrong-password',
          role: UserRole.USER,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
