import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AvailabilityService } from './availability.service';
import { CreateDoctorAvailabilityDto } from './dto/create-doctor-availability.dto';
import { DoctorService } from '../doctors/doctor.service';

@ApiTags('Availability')
@Controller('availability')
export class AvailabilityController {
  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly doctorService: DoctorService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('doctor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add or update doctor availability' })
  @ApiResponse({ status: 201, description: 'Availability successfully added/updated' })
  @ApiResponse({ status: 400, description: 'Invalid input or overlapping slots' })
  async addDoctorAvailability(
    @Request() req: any,
    @Body() dto: CreateDoctorAvailabilityDto,
  ) {
    
    // Find the doctor record for the current user
    const doctor = await this.doctorService.getDoctorByUserId(req.user.id);
    if (!doctor) {
      return { message: 'Doctor profile not found for this user.' };
    }
    return this.availabilityService.addDoctorAvailability(doctor.id, dto);
  }

  @Get('doctor/:id')
  @ApiOperation({ summary: 'Get doctor availability' })
  @ApiResponse({ status: 200, description: 'Returns doctor availability' })
  async getDoctorAvailability(@Param('id') doctorId: string) {
    return this.availabilityService.getDoctorAvailability(doctorId);
  }
} 