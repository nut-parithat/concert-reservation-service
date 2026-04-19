import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConcertsRepository } from './concerts.repository';
import { ReservationsRepository } from '../reservations/reservations.repository';
import { CreateConcertDto } from './dto/create-concert.dto';
import { ConcertDto, ReservationResponseDto } from './dto/concert-response.dto';
import { ConcertSummaryDto } from './dto/concert-summary.dto';
import { Concert } from './entities/concert.entity';
import {
  Reservation,
  ReservationStatus,
} from '../reservations/entities/reservation.entity';
@Injectable()
export class ConcertsService {
  constructor(
    private readonly concertsRepository: ConcertsRepository,
    private readonly reservationsRepository: ReservationsRepository,
  ) {}

  private toConcertDto(concert: Concert): ConcertDto {
    return {
      id: concert.id,
      name: concert.name,
      description: concert.description,
      totalSeat: concert.totalSeats,
      reservedSeat: concert.reservedSeat,
      cancelledSeat: concert.cancelledSeat,
      createdBy: concert.createdBy,
      createdAt: concert.createdAt.toISOString(),
    };
  }

  private toReservationDto(reservation: Reservation): ReservationResponseDto {
    return {
      reservationId: reservation.id,
      concertId: reservation.concertId,
      userId: reservation.userId,
      status: reservation.status,
      createdAt: reservation.createdAt.toISOString(),
    };
  }

  async getAll(): Promise<ConcertDto[]> {
    const concerts = await this.concertsRepository.findAll();
    return concerts.map((c) => this.toConcertDto(c));
  }

  async getSummary(): Promise<ConcertSummaryDto> {
    return this.concertsRepository.getSummary();
  }

  async create(dto: CreateConcertDto, userId: string): Promise<ConcertDto> {
    const concert = await this.concertsRepository.create({
      name: dto.name,
      description: dto.description ?? '',
      totalSeats: dto.totalSeat,
      createdBy: userId,
    });
    return this.toConcertDto(concert);
  }

  async delete(concertId: string, userId: string): Promise<void> {
    const concert = await this.concertsRepository.findById(concertId);
    if (!concert) {
      throw new NotFoundException('Concert not found');
    }
    if (concert.createdBy !== userId) {
      throw new ForbiddenException('You can only delete your own concerts');
    }
    await this.concertsRepository.delete(concertId);
  }

  async reserve(
    concertId: string,
    userId: string,
  ): Promise<ReservationResponseDto> {
    const concert = await this.concertsRepository.findById(concertId);
    if (!concert) {
      throw new NotFoundException('Concert not found');
    }

    const existing =
      await this.reservationsRepository.findActiveByUserAndConcert(
        userId,
        concertId,
      );
    if (existing) {
      throw new BadRequestException('You have already reserved this concert');
    }

    const availableSeats = concert.totalSeats - concert.reservedSeat;
    if (availableSeats <= 0) {
      throw new BadRequestException('No seats available');
    }

    concert.reservedSeat += 1;
    await this.concertsRepository.save(concert);

    const reservation = await this.reservationsRepository.create({
      userId,
      concertId,
      status: ReservationStatus.RESERVED,
    });

    return this.toReservationDto(reservation);
  }

  async cancel(
    concertId: string,
    userId: string,
  ): Promise<ReservationResponseDto> {
    const concert = await this.concertsRepository.findById(concertId);
    if (!concert) {
      throw new NotFoundException('Concert not found');
    }

    const reservation =
      await this.reservationsRepository.findActiveByUserAndConcert(
        userId,
        concertId,
      );
    if (!reservation) {
      throw new BadRequestException(
        'No active reservation found for this concert',
      );
    }

    concert.reservedSeat = Math.max(0, concert.reservedSeat - 1);
    concert.cancelledSeat += 1;
    await this.concertsRepository.save(concert);

    reservation.status = ReservationStatus.CANCELLED;
    reservation.cancelledAt = new Date();
    const updated = await this.reservationsRepository.save(reservation);

    return this.toReservationDto(updated);
  }
}
