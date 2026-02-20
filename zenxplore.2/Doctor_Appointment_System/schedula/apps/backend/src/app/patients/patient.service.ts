import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PatientService {
  constructor(private prisma: PrismaService) {}

  getPatient() {
    return { message: 'Hello Patient' };
  }

  async getPatientProfileAndAppointments(patientUserId: string) {
    // Find user
    const user = await this.prisma.users.findUnique({ where: { id: patientUserId } });
    if (!user) throw new BadRequestException('User not found');
    // Find patient profile
    const patient = await this.prisma.patient.findUnique({ where: { email: user.email } });
    if (!patient) throw new BadRequestException('Patient profile not found');
    // Get bookings with slot, doctor, and location info
    const bookings = await this.prisma.booking.findMany({
      where: { patientId: patient.id },
      include: {
        doctor_time_slot: {
          include: {
            availability: {
              include: {
                doctor: true,
                location: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return {
      profile: {
        id: patient.id,
        full_name: patient.full_name,
        email: patient.email,
        phone: patient.phone,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
      },
      appointments: bookings
        .filter(b => b.doctor_time_slot) // Only include bookings with a valid doctor_time_slot
        .map(b => ({
          bookingId: b.id,
          createdAt: b.createdAt,
          date: b.date,
          doctorTimeSlot: {
            id: b.doctor_time_slot.id,
            doctorId: b.doctor_time_slot.doctorId,
            locationId: b.doctor_time_slot.locationId,
            dayOfWeek: b.doctor_time_slot.dayOfWeek,
            startTime: b.doctor_time_slot.startTime,
            endTime: b.doctor_time_slot.endTime,
            maxPatients: b.doctor_time_slot.maxPatients,
          },
          doctor: b.doctor_time_slot.availability?.doctor
            ? {
                id: b.doctor_time_slot.availability.doctor.id,
                full_name: b.doctor_time_slot.availability.doctor.full_name,
                specialization: b.doctor_time_slot.availability.doctor.specialization,
                yearsOfExperience: b.doctor_time_slot.availability.doctor.yearsOfExperience,
                phone: b.doctor_time_slot.availability.doctor.phone,
                bio: b.doctor_time_slot.availability.doctor.bio,
                profilePic: b.doctor_time_slot.availability.doctor.profilePic,
                createdAt: b.doctor_time_slot.availability.doctor.createdAt,
                updatedAt: b.doctor_time_slot.availability.doctor.updatedAt,
              }
            : null,
          location: b.doctor_time_slot.availability?.location
            ? {
                id: b.doctor_time_slot.availability.location.id,
                name: b.doctor_time_slot.availability.location.name,
                address: b.doctor_time_slot.availability.location.address,
                city: b.doctor_time_slot.availability.location.city,
                state: b.doctor_time_slot.availability.location.state,
                country: b.doctor_time_slot.availability.location.country,
                postalCode: b.doctor_time_slot.availability.location.postalCode,
                createdAt: b.doctor_time_slot.availability.location.createdAt,
                updatedAt: b.doctor_time_slot.availability.location.updatedAt,
              }
            : null,
        })),
    };
  }
}