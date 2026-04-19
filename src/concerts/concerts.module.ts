import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Concert } from './entities/concert.entity';
import { ConcertsRepository } from './concerts.repository';
import { ConcertsService } from './concerts.service';
import { ConcertsController } from './concerts.controller';
import { ReservationsModule } from '../reservations/reservations.module';

@Module({
  imports: [TypeOrmModule.forFeature([Concert]), ReservationsModule],
  providers: [ConcertsRepository, ConcertsService],
  controllers: [ConcertsController],
})
export class ConcertsModule {}
