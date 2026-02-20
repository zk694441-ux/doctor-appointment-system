import { Controller, Post, Body, Put, Res, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDoctorDto } from './dto/register-doctor.dto';
import { LoginDto } from './dto/login.dto';
import { AddDoctorLocationsDto } from './dto/add-doctor-locations.dto';
import { RegisterPatientDto } from './dto/register-patient.dto';
// import { LoginPatientDto } from './dto/login-patient.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';



@ApiTags('Authentication')  // This groups the endpoints in Swagger
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register-doctor')
  @ApiOperation({ summary: 'Register a new doctor' })  // Operation summary
  @ApiBody({ type: RegisterDoctorDto })  // Request body type for this endpoint
  @ApiResponse({ status: 201, description: 'Doctor successfully registered' })  // Successful response
  @ApiResponse({ status: 400, description: 'Bad Request' })  // Error response
  async registerDoctor(@Body() dto: RegisterDoctorDto) {
    return this.authService.registerDoctor(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login for a doctor' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Successfully logged in', type: Object })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    
    // Set JWT as HttpOnly cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      
       // Use environment variable or default to localhost,
    });

    // Return user info but not the token
    return { user: result.user, profile: result.profile };
  }

  @Put('doctor/locations')
  @ApiOperation({ summary: 'Add locations for a doctor' })  // Operation summary
  @ApiBearerAuth()  // Indicates that the request requires Bearer token for authorization
  @ApiBody({ type: AddDoctorLocationsDto })  // Request body type for this endpoint
  @ApiResponse({ status: 200, description: 'Locations successfully added' })  // Successful response
  @ApiResponse({ status: 400, description: 'Doctor not found' })  // Error response
  async addLocations(@Body() dto: AddDoctorLocationsDto) {
    return this.authService.addDoctorLocations(dto);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout a user' })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  async logout(@Res({ passthrough: true }) res: Response) {
    // Clear the token cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/'
    });
    return this.authService.logout();
  }

  @Post('register-patient')
  @ApiOperation({ summary: 'Register a new patient' })  // Operation summary
  @ApiBody({ type: RegisterPatientDto })  // Request body type for this endpoint
  @ApiResponse({ status: 201, description: 'Patient successfully registered' })  // Successful response
  @ApiResponse({ status: 400, description: 'Bad Request' })  // Error response
  async registerPatient(@Body() dto: RegisterPatientDto) {
    return this.authService.registerPatient(dto);
    }
}
