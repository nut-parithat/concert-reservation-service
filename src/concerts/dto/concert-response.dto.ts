import { ReservationStatus } from '../../reservations/entities/reservation.entity';

export class ConcertDto {
  id: string;
  name: string;
  description: string;
  totalSeat: number;
  reservedSeat: number;
  cancelledSeat: number;
  createdBy: string;
  createdAt: string;
}

export class ReservationResponseDto {
  reservationId: string;
  concertId: string;
  userId: string;
  status: ReservationStatus;
  createdAt: string;
}
