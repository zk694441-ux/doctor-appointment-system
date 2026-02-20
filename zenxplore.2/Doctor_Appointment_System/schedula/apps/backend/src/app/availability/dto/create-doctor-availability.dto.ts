import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, ValidateNested, IsInt, Min, Matches } from 'class-validator';
import { Type } from 'class-transformer';

class TimeSlot {
  @ApiProperty({ example: '09:00', description: 'Start time of the slot (24-hour format)' })
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in 24-hour format (HH:mm)',
  })
  startTime!: string;

  @ApiProperty({ example: '17:00', description: 'End time of the slot (24-hour format)' })
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'End time must be in 24-hour format (HH:mm)',
  })
  endTime!: string;

  @ApiProperty({ example: 4, description: 'Maximum number of patients that can be scheduled in this slot' })
  @IsInt()
  @Min(1)
  maxPatients!: number;
}

export class CreateDoctorAvailabilityDto {
  @ApiProperty({ description: 'ID of the location where the doctor will be available' })
  @IsString()
  locationId!: string;

  @ApiProperty({ 
    description: 'Day of the week (string, e.g., "Monday")',
    enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    example: 'Monday',
  })
  @IsString()
  dayOfWeek!: string;

  @ApiProperty({ 
    type: [TimeSlot],
    description: 'Array of time slots for the day' 
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlot)
  timeSlots!: TimeSlot[];
}