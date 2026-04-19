import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConcertsModule } from './concerts/concerts.module';
import { ReservationsModule } from './reservations/reservations.module';
import { User } from './users/entities/user.entity';
import { Concert } from './concerts/entities/concert.entity';
import { Reservation } from './reservations/entities/reservation.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'admin'),
        password: configService.get<string>('DB_PASSWORD', 'admin123'),
        database: configService.get<string>('DB_NAME', 'concert_db'),
        entities: [User, Concert, Reservation],
        synchronize: false,
      }),
    }),
    AuthModule,
    UsersModule,
    ConcertsModule,
    ReservationsModule,
  ],
})
export class AppModule {}
