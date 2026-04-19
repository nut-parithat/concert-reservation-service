import { Injectable } from '@nestjs/common';
import { ReservationsRepository } from './reservations.repository';
import { ReservationHistoryDto } from './dto/reservation-history.dto';
import { Reservation, ReservationStatus } from './entities/reservation.entity';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly reservationsRepository: ReservationsRepository,
  ) {}

  private toHistoryRows(reservation: Reservation): ReservationHistoryDto[] {
    const username = reservation.user?.fullName ?? reservation.userId;
    const concertName = reservation.concert?.name ?? reservation.concertId;
    const rows: ReservationHistoryDto[] = [];

    rows.push({
      reservationId: reservation.id,
      action: 'reserve',
      username,
      concertName,
      datetime: reservation.createdAt.toISOString(),
    });

    if (
      reservation.status === ReservationStatus.CANCELLED &&
      reservation.cancelledAt
    ) {
      rows.push({
        reservationId: reservation.id,
        action: 'cancel',
        username,
        concertName,
        datetime: reservation.cancelledAt.toISOString(),
      });
    }

    return rows;
  }

  async getHistory(): Promise<ReservationHistoryDto[]> {
    const reservations = await this.reservationsRepository.findAllHistory();

    return reservations
      .flatMap((r) => this.toHistoryRows(r))
      .sort(
        (a, b) =>
          new Date(b.datetime).getTime() - new Date(a.datetime).getTime(),
      );
  }
}
