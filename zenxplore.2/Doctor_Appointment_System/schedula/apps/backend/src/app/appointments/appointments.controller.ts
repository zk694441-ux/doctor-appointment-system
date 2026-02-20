import { Controller, Post, Body, UseGuards, Request, Get, Param, Delete, Patch } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { BookSlotDto } from '../patients/dto/book-slot.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Request() req: any, @Body() dto: BookSlotDto) {
    // Pass userId (from JWT) separately, not as part of the DTO
    return this.appointmentsService.bookAppointment(dto, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('doctor/:doctorId')
  async getDoctorBookings(@Param('doctorId') doctorId: string) {
    return this.appointmentsService.getDoctorBookings(doctorId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async cancel(@Request() req: any, @Param('id') bookingId: string) {
    return this.appointmentsService.cancelAppointment(bookingId, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/reschedule')
  async reschedule(
    @Request() req: any,
    @Param('id') bookingId: string,
    @Body() dto: { date: string; startTime: string; endTime: string; dayOfWeek: string }
  ) {
    return this.appointmentsService.rescheduleAppointment(bookingId, dto, req.user.id);
  }
}
