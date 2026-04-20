import { UsersService } from '../users.service';
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

const mockUsersRepository = () => ({
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
});

const mockCacheManager = () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repo: ReturnType<typeof mockUsersRepository>;
  let cache: ReturnType<typeof mockCacheManager>;

  beforeEach(() => {
    repo = mockUsersRepository();
    cache = mockCacheManager();
    service = new UsersService(
      repo as unknown as UsersRepository,
      cache as never,
    );

    (service as unknown as { cacheManager: typeof cache }).cacheManager = cache;
  });

  describe('findById', () => {
    it('should return user from cache when cache HIT', async () => {
      const user = makeUser();
      cache.get.mockResolvedValue(user);

      const result = await service.findById('user-1');

      expect(result).toEqual(user);
      expect(repo.findById).not.toHaveBeenCalled();
    });

    it('should query DB and set cache when cache MISS', async () => {
      const user = makeUser();
      cache.get.mockResolvedValue(null);
      repo.findById.mockResolvedValue(user);

      const result = await service.findById('user-1');

      expect(repo.findById).toHaveBeenCalledWith('user-1');
      expect(cache.set).toHaveBeenCalledWith('user:user-1', user, 300000);
      expect(result).toEqual(user);
    });

    it('should return null and not set cache when user not found', async () => {
      cache.get.mockResolvedValue(null);
      repo.findById.mockResolvedValue(null);

      const result = await service.findById('not-exist');

      expect(result).toBeNull();
      expect(cache.set).not.toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('should return user from repository', async () => {
      const user = makeUser();
      repo.findByEmail.mockResolvedValue(user);

      const result = await service.findByEmail('john@example.com');

      expect(repo.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(result).toEqual(user);
    });

    it('should return null when email not found', async () => {
      repo.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail('nobody@example.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return user', async () => {
      const user = makeUser();
      repo.create.mockResolvedValue(user);

      const result = await service.create({ email: 'john@example.com' });

      expect(repo.create).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(result).toEqual(user);
    });
  });
});
