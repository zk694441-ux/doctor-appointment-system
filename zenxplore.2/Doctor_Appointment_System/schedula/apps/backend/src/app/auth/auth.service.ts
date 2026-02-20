import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { RegisterDoctorDto } from './dto/register-doctor.dto';
import { LoginDto } from './dto/login.dto';
import { AddDoctorLocationsDto } from './dto/add-doctor-locations.dto';
import { RegisterPatientDto } from './dto/register-patient.dto';
@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {
    // Verify JWT_SECRET at service initialization
    if (!process.env.JWT_SECRET) {
      throw new UnauthorizedException('Authentication service is not properly configured: JWT_SECRET is not set');
    }
  }

  async registerDoctor(dto: RegisterDoctorDto) {
    const {
      email,
      username,
      password,
      fullName,
      phone,
      bio,
      yearsOfExperience,
      profilePic,
      specialization,
      locations,
    } = dto;

    // Check for existing user
    const existingUser = await this.prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user first
    const user = await this.prisma.users.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: 'doctor',
      },
    });

    // Create the doctor and link the user
    const doctor = await this.prisma.doctors.create({
      data: {
        full_name: fullName,
        phone,
        bio,
        yearsOfExperience,
        profilePic,
        specialization: specialization,
        user_id: user.id,
      },
      include: {
        user: true,
        doctor_locations: {
          include: {
            location: true,
          },
        },
      },
    });

    return { message: 'Doctor registered successfully', doctor };
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    // Find user (doctor or patient) in users table
    const user = await this.prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Double check JWT_SECRET is available
    if (!process.env.JWT_SECRET) {
      throw new UnauthorizedException('Authentication service is not properly configured');
    }

    try {
      // Optionally, fetch doctor or patient profile
      let profile = null;
      if (user.role === 'doctor') {
        profile = await this.prisma.doctors.findUnique({ where: { user_id: user.id } });
      } else if (user.role === 'patient') {
        profile = await this.prisma.patient.findUnique({ where: { email: user.email } });
      }

      const token = jwt.sign(
        { 
          id: user.id, 
          role: user.role,
          email: user.email 
        }, 
        process.env.JWT_SECRET, 
        {
          expiresIn: '7d',
        }
      );

      return { 
        token, 
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }, 
        profile 
      };
    } catch (error) {
      throw new UnauthorizedException('Failed to generate authentication token');
    }
  }

  async addDoctorLocations(dto: AddDoctorLocationsDto) {
    const { doctorId, locations } = dto;

    const doctor = await this.prisma.doctors.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new BadRequestException('Doctor not found');
    }

    const updatedDoctor = await this.prisma.doctors.update({
      where: { id: doctorId },
      data: {
        doctor_locations: {
          create: locations.map((loc) => ({
            location: {
              create: {
                name: loc.name,
                address: loc.address,
                city: loc.city,
                state: loc.state,
                country: loc.country,
                postalCode: loc.postalCode,
              },
            },
          })),
        },
      },
      include: {
        doctor_locations: {
          include: {
            location: true,
          },
        },
      },
    });

    return { message: 'Locations added successfully', doctor: updatedDoctor };
  }

  async registerPatient(dto: RegisterPatientDto) {
    // Check for existing user
    const existingUser = await this.prisma.users.findUnique({ where: { email: dto.email } });
    if (existingUser) throw new BadRequestException('Email already in use');

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create the user first (role: patient)
    await this.prisma.users.create({
      data: {
        email: dto.email,
        username: dto.email, // or generate a username if needed
        password: hashedPassword,
        role: 'patient',
      },
    });

    // Create the patient and link the user
    const patient = await this.prisma.patient.create({
      data: {
        full_name: dto.full_name,
        phone: dto.phone,
        email: dto.email,
        password: hashedPassword, // for legacy, but not used for login
        // Optionally, add user_id if you want to link
      },
    });
    return { message: 'Patient registered', patient: { id: patient.id, email: patient.email, full_name: patient.full_name } };
  }

  async logout() {
    // In JWT-based auth, logout is typically handled client-side
    // by removing the token. This method is provided for API consistency.
    return { message: 'Logged out successfully' };
  }
}
