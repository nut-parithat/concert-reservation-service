import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { ConcertsRepository } from '../concerts.repository';
import { Concert } from '../entities/concert.entity';

const makeConcert = (overrides: Partial<Concert> = {}): Concert =>
  ({
    id: 'concert-1',
    name: 'Rock Fest',
    description: 'desc',
    totalSeats: 10,
    reservedSeat: 0,
    cancelledSeat: 0,
    createdBy: 'user-admin',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  }) as Concert;

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockQueryBuilder = () => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  getRawOne: jest.fn(),
});

describe('ConcertsRepository', () => {
  let repository: ConcertsRepository;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(() => {
    repo = mockRepo();
    repository = new ConcertsRepository(repo as unknown as Repository<Concert>);
  });

  describe('findAll', () => {
    it('should return all concerts ordered by createdAt DESC', async () => {
      const concerts = [makeConcert()];
      repo.find.mockResolvedValue(concerts);

      const result = await repository.findAll();

      expect(repo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
      expect(result).toEqual(concerts);
    });
  });

  describe('findById', () => {
    it('should return concert when found', async () => {
      const concert = makeConcert();
      repo.findOne.mockResolvedValue(concert);

      const result = await repository.findById('concert-1');

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'concert-1' } });
      expect(result).toEqual(concert);
    });

    it('should return null when not found', async () => {
      repo.findOne.mockResolvedValue(null);

      const result = await repository.findById('not-exist');

      expect(result).toBeNull();
    });
  });

  describe('findByIdWithLock', () => {
    it('should call manager.findOne with pessimistic_write lock', async () => {
      const concert = makeConcert();
      const findOneMock = jest.fn().mockResolvedValue(concert);
      const manager = {
        findOne: findOneMock,
      } as unknown as EntityManager;

      const result = await repository.findByIdWithLock('concert-1', manager);

      expect(findOneMock).toHaveBeenCalledWith(Concert, {
        where: { id: 'concert-1' },
        lock: { mode: 'pessimistic_write' },
      });
      expect(result).toEqual(concert);
    });

    it('should return null when concert not found', async () => {
      const findOneMock = jest.fn().mockResolvedValue(null);
      const manager = {
        findOne: findOneMock,
      } as unknown as EntityManager;

      const result = await repository.findByIdWithLock('not-exist', manager);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and save concert', async () => {
      const concert = makeConcert();
      repo.create.mockReturnValue(concert);
      repo.save.mockResolvedValue(concert);

      const result = await repository.create({
        name: 'Rock Fest',
        totalSeats: 10,
      });

      expect(repo.create).toHaveBeenCalledWith({
        name: 'Rock Fest',
        totalSeats: 10,
      });
      expect(repo.save).toHaveBeenCalledWith(concert);
      expect(result).toEqual(concert);
    });
  });

  describe('save', () => {
    it('should save and return concert', async () => {
      const concert = makeConcert();
      repo.save.mockResolvedValue(concert);

      const result = await repository.save(concert);

      expect(repo.save).toHaveBeenCalledWith(concert);
      expect(result).toEqual(concert);
    });
  });

  describe('delete', () => {
    it('should call repo.delete with the given id', async () => {
      repo.delete.mockResolvedValue(undefined);

      await repository.delete('concert-1');

      expect(repo.delete).toHaveBeenCalledWith('concert-1');
    });
  });

  describe('getSummary', () => {
    it('should return aggregated summary', async () => {
      const qb = mockQueryBuilder();
      qb.getRawOne.mockResolvedValue({
        totalSeats: '100',
        totalReserved: '40',
        totalCancelled: '10',
        totalAvailable: '60',
      });
      repo.createQueryBuilder.mockReturnValue(
        qb as unknown as SelectQueryBuilder<Concert>,
      );

      const result = await repository.getSummary();

      expect(result).toEqual({
        totalSeats: 100,
        totalReserved: 40,
        totalCancelled: 10,
        totalAvailable: 60,
      });
    });

    it('should return zeros when no data', async () => {
      const qb = mockQueryBuilder();
      qb.getRawOne.mockResolvedValue(null);
      repo.createQueryBuilder.mockReturnValue(
        qb as unknown as SelectQueryBuilder<Concert>,
      );

      const result = await repository.getSummary();

      expect(result).toEqual({
        totalSeats: 0,
        totalReserved: 0,
        totalCancelled: 0,
        totalAvailable: 0,
      });
    });
  });
});
