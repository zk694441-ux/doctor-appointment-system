import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface Doctor {
  id: string;
  full_name: string;
  specialization: string;
  yearsOfExperience?: number;
  phone: string;
  bio?: string;
  profilePic?: string;
  email?: string;
  locations?: Location[];
}

@Injectable()
export class DoctorService {
  constructor(private prisma: PrismaService) {}

  async getDoctors(): Promise<Doctor[]> {
    const doctors = await this.prisma.doctors.findMany({
      include: { 
        user: true,
        doctor_locations: {
          include: {
            location: true
          }
        }
      },
    });
    return doctors.map((doc: any) => ({
      id: doc.id,
      full_name: doc.full_name,
      specialization: doc.specialization,
      yearsOfExperience: doc.yearsOfExperience || undefined,
      phone: doc.phone,
      bio: doc.bio || undefined,
      profilePic: doc.profilePic || undefined,
      email: doc.user?.email,
      locations: doc.doctor_locations.map((dl: any) => ({
        id: dl.location.id,
        name: dl.location.name,
        address: dl.location.address,
        city: dl.location.city,
        state: dl.location.state,
        country: dl.location.country,
        postalCode: dl.location.postalCode
      }))
    }));
  }

  async getDoctorById(id: string): Promise<Doctor | { message: string }> {
    const doc = await this.prisma.doctors.findUnique({
      where: { id },
      include: { 
        user: true,
        doctor_locations: {
          include: {
            location: true
          }
        }
      },
    });
    
    if (doc) {
      return {
        id: doc.id,
        full_name: doc.full_name,
        specialization: doc.specialization,
        yearsOfExperience: doc.yearsOfExperience || undefined,
        phone: doc.phone,
        bio: doc.bio || undefined,
        profilePic: doc.profilePic || undefined,
        email: doc.user?.email,
        locations: doc.doctor_locations.map((dl: any) => ({
          id: dl.location.id,
          name: dl.location.name,
          address: dl.location.address,
          city: dl.location.city,
          state: dl.location.state,
          country: dl.location.country,
          postalCode: dl.location.postalCode
        }))
      };
    } else {
      return { message: 'Doctor not found' };
    }
  }

  async getDoctorByUserId(userId: string) {
    return this.prisma.doctors.findUnique({ where: { user_id: userId } });
  }
}
