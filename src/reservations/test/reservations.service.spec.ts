import { ReservationsService } from '../reservations.service';
import { ReservationsRepository } from '../reservations.repository';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';

const makeReservation = (overrides: Partial<Reservation> = {}): Reservation =>
  ({
    id: 'res-1',
    userId: 'user-1',
    concertId: 'concert-1',
    status: ReservationStatus.RESERVED,
    createdAt: new Date('2024-06-01T10:00:00Z'),
    cancelledAt: null,
    user: { fullName: 'John Doe' } as never,
    concert: { name: 'Rock Fest' } as never,
    ...overrides,
  }) as Reservation;

const mockReservationsRepository = () => ({
  findAllHistory: jest.fn(),
  findAllByUser: jest.fn(),
  findActiveByUserAndConcert: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('ReservationsService', () => {
  let service: ReservationsService;
  let repo: ReturnType<typeof mockReservationsRepository>;

  beforeEach(() => {
    repo = mockReservationsRepository();
    service = new ReservationsService(
      repo as unknown as ReservationsRepository,
    );
  });

  describe('getHistory', () => {
    it('should return reserve row for RESERVED reservation', async () => {
      repo.findAllHistory.mockResolvedValue([makeReservation()]);

      const result = await service.getHistory();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        reservationId: 'res-1',
        action: 'reserve',
        username: 'John Doe',
        concertName: 'Rock Fest',
      });
    });

    it('should return reserve + cancel rows for CANCELLED reservation', async () => {
      repo.findAllHistory.mockResolvedValue([
        makeReservation({
          status: ReservationStatus.CANCELLED,
          cancelledAt: new Date('2024-06-02T10:00:00Z'),
        }),
      ]);

      const result = await service.getHistory();

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.action)).toContain('reserve');
      expect(result.map((r) => r.action)).toContain('cancel');
    });

    it('should sort by datetime descending', async () => {
      repo.findAllHistory.mockResolvedValue([
        makeReservation({
          id: 'res-1',
          createdAt: new Date('2024-06-01T08:00:00Z'),
        }),
        makeReservation({
          id: 'res-2',
          createdAt: new Date('2024-06-01T12:00:00Z'),
        }),
      ]);

      const result = await service.getHistory();

      expect(result[0].reservationId).toBe('res-2');
      expect(result[1].reservationId).toBe('res-1');
    });

    it('should fallback to userId when user relation is not loaded', async () => {
      repo.findAllHistory.mockResolvedValue([
        makeReservation({ user: undefined as never }),
      ]);

      const result = await service.getHistory();

      expect(result[0].username).toBe('user-1');
    });

    it('should fallback to concertId when concert relation is not loaded', async () => {
      repo.findAllHistory.mockResolvedValue([
        makeReservation({ concert: undefined as never }),
      ]);

      const result = await service.getHistory();

      expect(result[0].concertName).toBe('concert-1');
    });

    it('should return empty array when no reservations', async () => {
      repo.findAllHistory.mockResolvedValue([]);

      const result = await service.getHistory();

      expect(result).toHaveLength(0);
    });
  });
});
