import { Module } from '@nestjs/common';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { DoctorService } from '../doctors/doctor.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AvailabilityController],
  providers: [AvailabilityService, DoctorService, PrismaService],
})
export class AvailabilityModule {} 