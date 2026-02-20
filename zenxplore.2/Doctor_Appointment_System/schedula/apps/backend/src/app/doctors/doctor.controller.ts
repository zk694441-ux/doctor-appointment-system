import { Controller, Get, Param } from '@nestjs/common';
import { DoctorService, Doctor } from './doctor.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Doctors')
@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  @ApiOperation({ summary: 'Get all doctors' })
  @ApiResponse({ status: 200, description: 'Returns list of all doctors' })
  async getDoctors(): Promise<Doctor[]> {
    return this.doctorService.getDoctors();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get doctor by ID' })
  @ApiResponse({ status: 200, description: 'Returns doctor details' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  async getDoctorById(@Param('id') id: string): Promise<Doctor | { message: string }> {
    return this.doctorService.getDoctorById(id);
  }
}
