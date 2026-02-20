import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { PatientService } from './patient.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Get()
  getPatient() {
    return this.patientService.getPatient();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfileAndAppointments(@Req() req: any) {
    // req.user.id should be set by JWT AuthGuard
    return this.patientService.getPatientProfileAndAppointments(req.user.id);
  }
}