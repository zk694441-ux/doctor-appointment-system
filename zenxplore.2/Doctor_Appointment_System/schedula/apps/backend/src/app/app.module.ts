import { Module } from '@nestjs/common';
import { DoctorModule } from './doctors/doctor.module';
import { PatientModule } from './patients/patient.module';
import { AuthModule } from './auth/auth.module';
import { AvailabilityModule } from './availability/availability.module';
import { AppointmentsModule } from './appointments/appointments.module';

@Module({
  imports: [DoctorModule, PatientModule, AuthModule, AvailabilityModule, AppointmentsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
