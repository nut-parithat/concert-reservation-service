import { Repository } from 'typeorm';
import { UsersRepository } from '../users.repository';
import { User, UserRole } from '../entities/user.entity';

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    email: 'john@example.com',
    fullName: 'John Doe',
    role: UserRole.USER,
    passwordHash: 'hashed',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  }) as User;

const mockRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(() => {
    repo = mockRepo();
    repository = new UsersRepository(repo as unknown as Repository<User>);
  });

  describe('findByEmail', () => {
    it('should return user when email found', async () => {
      const user = makeUser();
      repo.findOne.mockResolvedValue(user);

      const result = await repository.findByEmail('john@example.com');

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
      expect(result).toEqual(user);
    });

    it('should return null when email not found', async () => {
      repo.findOne.mockResolvedValue(null);

      const result = await repository.findByEmail('nobody@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user when id found', async () => {
      const user = makeUser();
      repo.findOne.mockResolvedValue(user);

      const result = await repository.findById('user-1');

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'user-1' } });
      expect(result).toEqual(user);
    });

    it('should return null when id not found', async () => {
      repo.findOne.mockResolvedValue(null);

      const result = await repository.findById('not-exist');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and save user', async () => {
      const user = makeUser();
      repo.create.mockReturnValue(user);
      repo.save.mockResolvedValue(user);

      const result = await repository.create({ email: 'john@example.com' });

      expect(repo.create).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(repo.save).toHaveBeenCalledWith(user);
      expect(result).toEqual(user);
    });
  });
});
