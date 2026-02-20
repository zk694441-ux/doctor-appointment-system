import { IsUUID, IsEnum, IsArray, IsString, ArrayNotEmpty, ValidateNested, IsInt, Min, IsMilitaryTime } from 'class-validator';
import { Type } from 'class-transformer';

export enum DayOfWeek {
  Monday = 'Monday',
  Tuesday = 'Tuesday',
  Wednesday = 'Wednesday',
  Thursday = 'Thursday',
  Friday = 'Friday',
  Saturday = 'Saturday',
  Sunday = 'Sunday',
}

export class TimeSlotDto {
  @IsMilitaryTime()
  startTime!: string; // e.g. '09:00'

  @IsMilitaryTime()
  endTime!: string; // e.g. '11:00'

  @IsInt()
  @Min(1)
  maxPatients!: number;
}

export class CreateDoctorAvailabilityDto {
  @IsUUID()
  locationId!: string;

  @IsEnum(DayOfWeek)
  dayOfWeek!: DayOfWeek;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  timeSlots!: TimeSlotDto[]; // Array of time slot objects
}
