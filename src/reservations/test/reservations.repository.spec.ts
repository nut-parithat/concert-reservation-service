import { Repository } from 'typeorm';
import { ReservationsRepository } from '../reservations.repository';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import { Concert } from '../../concerts/entities/concert.entity';
import { User } from '../../users/entities/user.entity';

const makeReservation = (overrides: Partial<Reservation> = {}): Reservation =>
  ({
    id: 'res-1',
    userId: 'user-1',
    concertId: 'concert-1',
    status: ReservationStatus.RESERVED,
    createdAt: new Date('2024-01-01'),
    cancelledAt: null,
    ...overrides,
  }) as Reservation;

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('ReservationsRepository', () => {
  let repository: ReservationsRepository;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(() => {
    repo = mockRepo();
    repository = new ReservationsRepository(
      repo as unknown as Repository<Reservation>,
    );
  });

  describe('findActiveByUserAndConcert', () => {
    it('should return active reservation when found', async () => {
      const reservation = makeReservation();
      repo.findOne.mockResolvedValue(reservation);

      const result = await repository.findActiveByUserAndConcert(
        'user-1',
        'concert-1',
      );

      expect(repo.findOne).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          concertId: 'concert-1',
          status: ReservationStatus.RESERVED,
        },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(reservation);
    });

    it('should return null when no active reservation', async () => {
      repo.findOne.mockResolvedValue(null);

      const result = await repository.findActiveByUserAndConcert(
        'user-1',
        'concert-x',
      );

      expect(result).toBeNull();
    });
  });

  describe('findAllByUser', () => {
    it('should return reservations with concert relation for the user', async () => {
      const reservations = [makeReservation()];
      repo.find.mockResolvedValue(reservations);

      const result = await repository.findAllByUser('user-1');

      expect(repo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        relations: ['concert'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(reservations);
    });

    it('should return empty array when user has no reservations', async () => {
      repo.find.mockResolvedValue([]);

      const result = await repository.findAllByUser('user-new');

      expect(result).toHaveLength(0);
    });
  });

  describe('findAllHistory', () => {
    it('should return all reservations with concert and user relations', async () => {
      const reservations = [
        makeReservation({
          concert: { name: 'Rock Fest' } as Concert,
          user: { fullName: 'John' } as User,
        }),
      ];
      repo.find.mockResolvedValue(reservations);

      const result = await repository.findAllHistory();

      expect(repo.find).toHaveBeenCalledWith({
        relations: ['concert', 'user'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(reservations);
    });
  });

  describe('create', () => {
    it('should create and save reservation', async () => {
      const reservation = makeReservation();
      repo.create.mockReturnValue(reservation);
      repo.save.mockResolvedValue(reservation);

      const result = await repository.create({
        userId: 'user-1',
        concertId: 'concert-1',
        status: ReservationStatus.RESERVED,
      });

      expect(repo.create).toHaveBeenCalledWith({
        userId: 'user-1',
        concertId: 'concert-1',
        status: ReservationStatus.RESERVED,
      });
      expect(repo.save).toHaveBeenCalledWith(reservation);
      expect(result).toEqual(reservation);
    });
  });

  describe('save', () => {
    it('should save and return updated reservation', async () => {
      const reservation = makeReservation({
        status: ReservationStatus.CANCELLED,
      });
      repo.save.mockResolvedValue(reservation);

      const result = await repository.save(reservation);

      expect(repo.save).toHaveBeenCalledWith(reservation);
      expect(result.status).toBe(ReservationStatus.CANCELLED);
    });
  });
});
