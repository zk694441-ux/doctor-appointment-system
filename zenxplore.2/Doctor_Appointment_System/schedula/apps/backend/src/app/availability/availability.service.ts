import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorAvailabilityDto } from './dto/create-doctor-availability.dto';
import { DayOfWeek } from '../auth/dto/create-doctor-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  async addDoctorAvailability(doctorId: string, dto: CreateDoctorAvailabilityDto) {
    const parseTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    };

    // Convert numeric dayOfWeek to DayOfWeek string if needed
    let dayOfWeek: DayOfWeek;
    if (typeof dto.dayOfWeek === 'number') {
      const dayNames: DayOfWeek[] = [
        DayOfWeek.Sunday,
        DayOfWeek.Monday,
        DayOfWeek.Tuesday,
        DayOfWeek.Wednesday,
        DayOfWeek.Thursday,
        DayOfWeek.Friday,
        DayOfWeek.Saturday,
      ];
      dayOfWeek = dayNames[dto.dayOfWeek];
    } else {
      dayOfWeek = dto.dayOfWeek as DayOfWeek;
    }

    // Step 1: Fetch all slots for this doctor on the same day (across ALL locations)
    const existingSlots = await this.prisma.doctor_time_slot.findMany({
      where: {
        doctorId,
        dayOfWeek,
      },
    });

    // Step 2: Check if any new slot overlaps with existing slots on the same day, but only in other locations
    for (const newSlot of dto.timeSlots) {
      const newStart = parseTime(newSlot.startTime);
      const newEnd = parseTime(newSlot.endTime);

      for (const slot of existingSlots) {
        // Only check for overlap if the slot is in a different location
        if (slot.locationId === dto.locationId) continue;
        const existingStart = parseTime(slot.startTime);
        const existingEnd = parseTime(slot.endTime);

        if (newStart < existingEnd && newEnd > existingStart) {
          return {
            success: false,
            message: `❌ Overlapping slot: ${newSlot.startTime}–${newSlot.endTime} overlaps with existing ${slot.startTime}–${slot.endTime} in another location (${slot.locationId}).`,
          };
        }
      }
    }

    // Step 3: Upsert availability record for the day/location
    await this.prisma.doctor_availability.upsert({
      where: {
        doctorId_locationId_dayOfWeek: {
          doctorId,
          locationId: dto.locationId,
          dayOfWeek,
        },
      },
      update: {},
      create: {
        doctorId,
        locationId: dto.locationId,
        dayOfWeek,
      },
    });

    // Step 4: Remove slots that are NOT in the new dto.timeSlots (by startTime and endTime)
    const newSlotKeys = dto.timeSlots.map(slot => `${slot.startTime}-${slot.endTime}`);
    const slotsToRemove = await this.prisma.doctor_time_slot.findMany({
      where: {
        doctorId,
        locationId: dto.locationId,
        dayOfWeek: dayOfWeek,
      },
    });
    for (const slot of slotsToRemove) {
      const key = `${slot.startTime}-${slot.endTime}`;
      if (!newSlotKeys.includes(key)) {
        // Delete bookings for this slot
        await this.prisma.booking.deleteMany({ where: { doctorTimeSlotId: slot.id } });
        // Delete the slot itself
        await this.prisma.doctor_time_slot.delete({ where: { id: slot.id } });
      }
    }

    // Step 5: For each new slot, update if exists, otherwise create
    for (const newSlot of dto.timeSlots) {
      const existingSlot = await this.prisma.doctor_time_slot.findFirst({
        where: {
          doctorId,
          locationId: dto.locationId,
          dayOfWeek: dayOfWeek,
          startTime: newSlot.startTime,
          endTime: newSlot.endTime,
        },
      });
      if (existingSlot) {
        await this.prisma.doctor_time_slot.update({
          where: { id: existingSlot.id },
          data: { maxPatients: newSlot.maxPatients },
        });
      } else {
        await this.prisma.doctor_time_slot.create({
          data: {
            doctorId,
            locationId: dto.locationId,
            dayOfWeek: dayOfWeek,
            startTime: newSlot.startTime,
            endTime: newSlot.endTime,
            maxPatients: newSlot.maxPatients,
          },
        });
      }
    }

    return { success: true, message: 'Availability updated successfully', slots: dto.timeSlots };
  }

  async getDoctorAvailability(doctorId: string) {
    const availabilities = await this.prisma.doctor_availability.findMany({
      where: { doctorId },
      include: {
        location: true,
        time_slots: true,
      },
    });

    return availabilities.map((av) => ({
      id: `${av.doctorId}_${av.locationId}_${av.dayOfWeek}`,
      location: av.location,
      dayOfWeek: av.dayOfWeek,
      timeSlots: av.time_slots.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxPatients: slot.maxPatients,
      })),
    }));
  }
}