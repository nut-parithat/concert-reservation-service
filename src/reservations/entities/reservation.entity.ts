import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Concert } from '../../concerts/entities/concert.entity';

export enum ReservationStatus {
  RESERVED = 'RESERVED',
  CANCELLED = 'CANCELLED',
}

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'concert_id', type: 'uuid' })
  concertId: string;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    enumName: 'reservation_status',
    default: ReservationStatus.RESERVED,
  })
  status: ReservationStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Concert)
  @JoinColumn({ name: 'concert_id' })
  concert: Concert;
}
