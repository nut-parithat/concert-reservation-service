import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from './entities/reservation.entity';
import { ReservationsRepository } from './reservations.repository';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation])],
  providers: [ReservationsRepository, ReservationsService],
  controllers: [ReservationsController],
  exports: [ReservationsRepository],
})
export class ReservationsModule {}
