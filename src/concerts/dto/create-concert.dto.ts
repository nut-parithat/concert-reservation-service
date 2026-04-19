import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateConcertDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  totalSeat: number;
}
