import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReservationsService } from './reservations.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/users/entities/user.entity';

@Controller('reservation')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get('history')
  @Roles(UserRole.ADMIN)
  getHistory() {
    return this.reservationsService.getHistory();
  }
}
