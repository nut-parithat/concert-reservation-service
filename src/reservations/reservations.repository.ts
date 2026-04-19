import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation, ReservationStatus } from './entities/reservation.entity';

@Injectable()
export class ReservationsRepository {
  constructor(
    @InjectRepository(Reservation)
    private readonly repo: Repository<Reservation>,
  ) {}

  findActiveByUserAndConcert(
    userId: string,
    concertId: string,
  ): Promise<Reservation | null> {
    return this.repo.findOne({
      where: { userId, concertId, status: ReservationStatus.RESERVED },
      order: { createdAt: 'DESC' },
    });
  }

  findAllByUser(userId: string): Promise<Reservation[]> {
    return this.repo.find({
      where: { userId },
      relations: ['concert'],
      order: { createdAt: 'DESC' },
    });
  }

  findAllHistory(): Promise<Reservation[]> {
    return this.repo.find({
      relations: ['concert', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  create(data: Partial<Reservation>): Promise<Reservation> {
    const reservation = this.repo.create(data);
    return this.repo.save(reservation);
  }

  save(reservation: Reservation): Promise<Reservation> {
    return this.repo.save(reservation);
  }
}
