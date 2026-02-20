import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookSlotDto } from '../patients/dto/book-slot.dto';
import { addMinutes } from 'date-fns';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async bookAppointment(dto: BookSlotDto, userId: string) {
    // 1. Find the slot by doctorId, locationId, dayOfWeek, startTime, endTime
    const slot = await this.prisma.doctor_time_slot.findFirst({
      where: {
        doctorId: dto.doctorId,
        locationId: dto.locationId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        maxPatients: true,
      },
    });
    if (!slot) throw new BadRequestException('Time slot not found');

    // 2. Look up patient record by user id (from JWT)
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    const patient = await this.prisma.patient.findUnique({ where: { email: user.email } });
    if (!patient) throw new BadRequestException('Patient profile not found');

    // 3. Check if slot is full for this date
    const bookingsForDate = await this.prisma.booking.findMany({
      where: {
        doctorTimeSlotId: slot.id,
        date: new Date(dto.date),
      },
    });
    if (bookingsForDate.length >= slot.maxPatients) {
      throw new BadRequestException('This slot is fully booked for this date');
    }

    // 4. Prevent double booking for same patient/slot/date
    const existing = await this.prisma.booking.findFirst({
      where: {
        patientId: patient.id,
        doctorTimeSlotId: slot.id,
        date: new Date(dto.date),
      },
    });
    if (existing) throw new BadRequestException('You have already booked this slot for this date');

    // 5. Create booking (with date)
    const booking = await this.prisma.booking.create({
      data: {
        patientId: patient.id,
        doctorTimeSlotId: slot.id,
        date: new Date(dto.date),
      },
    });

    // 6. Calculate arrival time dynamically based on session duration and max patients
    const sessionStart = new Date(`${dto.date}T${slot.startTime}`);
    
    const sessionEnd = new Date(`${dto.date}T${slot.endTime}`);
    // If end time is past midnight, adjust date
    if (sessionEnd < sessionStart) sessionEnd.setDate(sessionEnd.getDate() + 1);
    const sessionDurationMinutes = (sessionEnd.getTime() - sessionStart.getTime()) / 60000;
    const perPatientMinutes = Math.floor(sessionDurationMinutes / slot.maxPatients);
    const patientIndex = bookingsForDate.length; // 0-based for this date
    const arrivalTime = addMinutes(sessionStart, patientIndex * perPatientMinutes);

    return {
      message: 'Booking successful',
      bookingId: booking.id,
      arrivalTime: arrivalTime.toTimeString().slice(0, 5),
    };
  }

  async getDoctorBookings(doctorId: string) {
    // Verify doctor exists
    const doctor = await this.prisma.doctors.findUnique({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new BadRequestException('Doctor not found');
    }

    // Fetch all bookings for the doctor
    const bookings = await this.prisma.booking.findMany({
      where: {
        doctor_time_slot: {
          doctorId: doctorId,
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
        doctor_time_slot: {
          select: {
            startTime: true,
            endTime: true,
            dayOfWeek: true,
            availability: {
              select: {
                location: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    city: true,
                    state: true,
                    country: true,
                    postalCode: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to match the frontend interface
    return bookings.map(booking => ({
      id: booking.id,
      patient: booking.patient,
      location: booking.doctor_time_slot.availability.location,
      date: booking.date, // Pass the actual booking date
      startTime: booking.doctor_time_slot.startTime,
      endTime: booking.doctor_time_slot.endTime,
    }));
  }

  async cancelAppointment(bookingId: string, userId: string) {
    // Find booking and ensure user is the patient
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { patient: true },
    });
    if (!booking) throw new BadRequestException('Booking not found');
    // Only the patient who booked can cancel
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    if (booking.patient.email !== user.email) throw new BadRequestException('You can only cancel your own appointments');
    await this.prisma.booking.delete({ where: { id: bookingId } });
    return { message: 'Appointment canceled' };
  }

  async rescheduleAppointment(bookingId: string, dto: { date: string; startTime: string; endTime: string; dayOfWeek: string }, userId: string) {
    
    if (!dto.startTime || !dto.endTime || !dto.dayOfWeek) {
      
      throw new BadRequestException('No time slot selected. Please select a valid slot.');
    }
    // Find booking and ensure user is the patient, and include doctor_time_slot
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { patient: true, doctor_time_slot: true },
    });
    
    if (!booking) throw new BadRequestException('Booking not found');
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    if (booking.patient.email !== user.email) throw new BadRequestException('You can only reschedule your own appointments');
    // Find the slot by doctorId, locationId, dayOfWeek, startTime, endTime
    const doctorTimeSlot = await this.prisma.doctor_time_slot.findFirst({
      where: {
        doctorId: booking.doctor_time_slot.doctorId,
        locationId: booking.doctor_time_slot.locationId,
        dayOfWeek: dto.dayOfWeek as any, // cast to enum if needed
        startTime: dto.startTime,
        endTime: dto.endTime,
      },
    });
    
    if (!doctorTimeSlot) throw new BadRequestException('Time slot not found');
    // Fix: Always store the date as UTC midnight (no timezone offset)
    // Parse the date as local, then set UTC time to midnight
    const localDate = new Date(dto.date);
    const bookingDate = new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate()));
    // Check if slot is full for new date
    const bookingsForDate = await this.prisma.booking.findMany({
      where: {
        doctorTimeSlotId: doctorTimeSlot.id,
        date: bookingDate,
      },
    });
    if (bookingsForDate.length >= doctorTimeSlot.maxPatients) {
      throw new BadRequestException('This slot is fully booked for this date');
    }
    // Prevent double booking for same patient/slot/date
    const existing = await this.prisma.booking.findFirst({
      where: {
        patientId: booking.patientId,
        doctorTimeSlotId: doctorTimeSlot.id,
        date: bookingDate,
        NOT: { id: bookingId },
      },
    });
    if (existing) throw new BadRequestException('You have already booked this slot for this date');
    // Update booking and fetch the updated booking
    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        doctorTimeSlotId: doctorTimeSlot.id,
        date: bookingDate,
      },
      include: { doctor_time_slot: true },
    });
     
    // Calculate arrival time for the rescheduled slot
    const sessionStart = new Date(`${dto.date}T${doctorTimeSlot.startTime}`);
    const sessionEnd = new Date(`${dto.date}T${doctorTimeSlot.endTime}`);
    if (sessionEnd < sessionStart) sessionEnd.setDate(sessionEnd.getDate() + 1);
    const sessionDurationMinutes = (sessionEnd.getTime() - sessionStart.getTime()) / 60000;
    const perPatientMinutes = Math.floor(sessionDurationMinutes / doctorTimeSlot.maxPatients);
    // Find the index of the current booking for the new date/slot
    const sortedBookings = await this.prisma.booking.findMany({
      where: {
        doctorTimeSlotId: doctorTimeSlot.id,
        date: bookingDate,
      },
      orderBy: { createdAt: 'asc' },
    });
    const patientIndex = sortedBookings.findIndex(b => b.id === bookingId);
    const arrivalTime = addMinutes(sessionStart, patientIndex * perPatientMinutes);
    return { message: 'Appointment rescheduled', arrivalTime: arrivalTime.toTimeString().slice(0, 5), date: updatedBooking.date };
  }
}
