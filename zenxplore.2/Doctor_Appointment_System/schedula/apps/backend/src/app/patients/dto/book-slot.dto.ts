import { IsUUID, IsString, IsEnum } from 'class-validator';
import { DayOfWeek } from '../../auth/dto/create-doctor-availability.dto';

export class BookSlotDto {
  @IsUUID()
  doctorId!: string;

  @IsUUID()
  locationId!: string;

  @IsEnum(DayOfWeek)
  dayOfWeek!: DayOfWeek;

  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;

  @IsString()
  date!: string; // ISO date string (YYYY-MM-DD)
}