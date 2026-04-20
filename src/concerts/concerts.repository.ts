import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Concert } from './entities/concert.entity';

@Injectable()
export class ConcertsRepository {
  constructor(
    @InjectRepository(Concert)
    private readonly repo: Repository<Concert>,
  ) {}

  findAll(): Promise<Concert[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  findById(id: string): Promise<Concert | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByIdWithLock(
    id: string,
    manager: EntityManager,
  ): Promise<Concert | null> {
    return manager.findOne(Concert, {
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
  }

  create(data: Partial<Concert>): Promise<Concert> {
    const concert = this.repo.create(data);
    return this.repo.save(concert);
  }

  save(concert: Concert): Promise<Concert> {
    return this.repo.save(concert);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async getSummary(): Promise<{
    totalSeats: number;
    totalReserved: number;
    totalCancelled: number;
    totalAvailable: number;
  }> {
    const result = await this.repo
      .createQueryBuilder('concert')
      .select('SUM(concert.total_seats)', 'totalSeats')
      .addSelect('SUM(concert.reserved_seat)', 'totalReserved')
      .addSelect('SUM(concert.cancelled_seat)', 'totalCancelled')
      .addSelect(
        'SUM(concert.total_seats - concert.reserved_seat)',
        'totalAvailable',
      )
      .getRawOne<{
        totalSeats: string;
        totalReserved: string;
        totalCancelled: string;
        totalAvailable: string;
      }>();

    return {
      totalSeats: Number(result?.totalSeats ?? 0),
      totalReserved: Number(result?.totalReserved ?? 0),
      totalCancelled: Number(result?.totalCancelled ?? 0),
      totalAvailable: Number(result?.totalAvailable ?? 0),
    };
  }
}
