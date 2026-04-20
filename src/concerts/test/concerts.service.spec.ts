import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConcertsService } from '../concerts.service';
import { ConcertsRepository } from '../concerts.repository';
import { ReservationsRepository } from '../../reservations/reservations.repository';
import { ReservationStatus } from '../../reservations/entities/reservation.entity';
import { Concert } from '../entities/concert.entity';
import { Reservation } from '../../reservations/entities/reservation.entity';
import { DataSource, EntityManager } from 'typeorm';

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

const makeReservation = (overrides: Partial<Reservation> = {}): Reservation =>
  ({
    id: 'res-1',
    userId: 'user-1',
    concertId: 'concert-1',
    status: ReservationStatus.RESERVED,
    createdAt: new Date('2024-01-02'),
    cancelledAt: null,
    ...overrides,
  }) as Reservation;

const mockConcertsRepository = () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  findByIdWithLock: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  getSummary: jest.fn(),
});

const mockReservationsRepository = () => ({
  findAllByUser: jest.fn(),
  findActiveByUserAndConcert: jest.fn(),
});

const mockEntityManager = (): jest.Mocked<
  Pick<EntityManager, 'findOne' | 'save' | 'create'>
> => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
});

const mockDataSource = (manager: ReturnType<typeof mockEntityManager>) => ({
  transaction: jest.fn((cb: (m: EntityManager) => Promise<unknown>) =>
    cb(manager as unknown as EntityManager),
  ),
});

describe('ConcertsService', () => {
  let service: ConcertsService;
  let concertsRepo: ReturnType<typeof mockConcertsRepository>;
  let reservationsRepo: ReturnType<typeof mockReservationsRepository>;
  let manager: ReturnType<typeof mockEntityManager>;
  let dataSource: ReturnType<typeof mockDataSource>;

  beforeEach(() => {
    concertsRepo = mockConcertsRepository();
    reservationsRepo = mockReservationsRepository();
    manager = mockEntityManager();
    dataSource = mockDataSource(manager);

    service = new ConcertsService(
      concertsRepo as unknown as ConcertsRepository,
      reservationsRepo as unknown as ReservationsRepository,
      dataSource as unknown as DataSource,
    );
  });

  describe('getAll', () => {
    it('should return list of ConcertDto', async () => {
      concertsRepo.findAll.mockResolvedValue([makeConcert()]);

      const result = await service.getAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 'concert-1', name: 'Rock Fest' });
    });
  });

  describe('getAllForUser', () => {
    it('should mark isReserved=true for concerts the user has reserved', async () => {
      concertsRepo.findAll.mockResolvedValue([
        makeConcert({ id: 'concert-1' }),
        makeConcert({ id: 'concert-2', name: 'Jazz Night' }),
      ]);
      reservationsRepo.findAllByUser.mockResolvedValue([
        makeReservation({
          concertId: 'concert-1',
          status: ReservationStatus.RESERVED,
        }),
      ]);

      const result = await service.getAllForUser('user-1');

      expect(result[0].isReserved).toBe(true);
      expect(result[1].isReserved).toBe(false);
    });

    it('should mark isReserved=false for CANCELLED reservation', async () => {
      concertsRepo.findAll.mockResolvedValue([makeConcert()]);
      reservationsRepo.findAllByUser.mockResolvedValue([
        makeReservation({ status: ReservationStatus.CANCELLED }),
      ]);

      const result = await service.getAllForUser('user-1');

      expect(result[0].isReserved).toBe(false);
    });
  });

  describe('create', () => {
    it('should create and return ConcertDto', async () => {
      const concert = makeConcert();
      concertsRepo.create.mockResolvedValue(concert);

      const result = await service.create(
        { name: 'Rock Fest', description: 'desc', totalSeat: 10 },
        'user-admin',
      );

      expect(concertsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Rock Fest', totalSeats: 10 }),
      );
      expect(result.id).toBe('concert-1');
    });
  });

  describe('delete', () => {
    it('should delete when owner matches', async () => {
      concertsRepo.findById.mockResolvedValue(
        makeConcert({ createdBy: 'user-admin' }),
      );

      await expect(
        service.delete('concert-1', 'user-admin'),
      ).resolves.toBeUndefined();
      expect(concertsRepo.delete).toHaveBeenCalledWith('concert-1');
    });

    it('should throw NotFoundException when concert not found', async () => {
      concertsRepo.findById.mockResolvedValue(null);

      await expect(service.delete('concert-x', 'user-admin')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when not owner', async () => {
      concertsRepo.findById.mockResolvedValue(
        makeConcert({ createdBy: 'other-user' }),
      );

      await expect(service.delete('concert-1', 'user-admin')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('reserve', () => {
    it('should reserve and increment reservedSeat', async () => {
      const concert = makeConcert({ totalSeats: 5, reservedSeat: 0 });
      const reservation = makeReservation();

      concertsRepo.findByIdWithLock.mockResolvedValue(concert);
      (manager.findOne as jest.Mock).mockResolvedValue(null);
      (manager.save as jest.Mock)
        .mockResolvedValueOnce(concert)
        .mockResolvedValueOnce(reservation);
      (manager.create as jest.Mock).mockReturnValue(reservation);

      const result = await service.reserve('concert-1', 'user-1');

      expect(concert.reservedSeat).toBe(1);
      expect(result.reservationId).toBe('res-1');
    });

    it('should throw NotFoundException when concert not found', async () => {
      concertsRepo.findByIdWithLock.mockResolvedValue(null);

      await expect(service.reserve('concert-x', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when already reserved', async () => {
      concertsRepo.findByIdWithLock.mockResolvedValue(makeConcert());
      (manager.findOne as jest.Mock).mockResolvedValue(makeReservation());

      await expect(service.reserve('concert-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when no seats available', async () => {
      concertsRepo.findByIdWithLock.mockResolvedValue(
        makeConcert({ totalSeats: 1, reservedSeat: 1 }),
      );
      (manager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.reserve('concert-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cancel', () => {
    it('should cancel reservation and update seats', async () => {
      const concert = makeConcert({ reservedSeat: 1, cancelledSeat: 0 });
      const reservation = makeReservation();
      const cancelled = {
        ...reservation,
        status: ReservationStatus.CANCELLED,
        cancelledAt: new Date(),
      };

      concertsRepo.findByIdWithLock.mockResolvedValue(concert);
      (manager.findOne as jest.Mock).mockResolvedValue(reservation);
      (manager.save as jest.Mock)
        .mockResolvedValueOnce(concert)
        .mockResolvedValueOnce(cancelled);

      const result = await service.cancel('concert-1', 'user-1');

      expect(concert.reservedSeat).toBe(0);
      expect(concert.cancelledSeat).toBe(1);
      expect(result.status).toBe(ReservationStatus.CANCELLED);
    });

    it('should throw NotFoundException when concert not found', async () => {
      concertsRepo.findByIdWithLock.mockResolvedValue(null);

      await expect(service.cancel('concert-x', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when no active reservation', async () => {
      concertsRepo.findByIdWithLock.mockResolvedValue(makeConcert());
      (manager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.cancel('concert-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
