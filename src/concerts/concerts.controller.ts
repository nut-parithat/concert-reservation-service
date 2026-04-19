import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConcertsService } from './concerts.service';
import { CreateConcertDto } from './dto/create-concert.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('concert')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ConcertsController {
  constructor(private readonly concertsService: ConcertsService) {}

  @Get()
  getAll() {
    return this.concertsService.getAll();
  }

  @Get('summary')
  @Roles(UserRole.ADMIN)
  getSummary() {
    return this.concertsService.getSummary();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateConcertDto, @Request() req: RequestWithUser) {
    return this.concertsService.create(dto, req.user.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  delete(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.concertsService.delete(id, req.user.id);
  }

  @Post(':id/reserve')
  reserve(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.concertsService.reserve(id, req.user.id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.concertsService.cancel(id, req.user.id);
  }
}
