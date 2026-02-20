import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class RegisterDoctorDto {
  @ApiProperty({ description: 'The email of the doctor', type: String })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'The username of the doctor', type: String })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'The password of the doctor', type: String })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: 'Full name of the doctor', type: String })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ description: 'Phone number of the doctor', type: String })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'A short bio of the doctor',
    type: String,
    required: false,
    example: 'Experienced cardiologist with over 10 years of practice',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({
    description: 'Number of years the doctor has been practicing',
    type: Number,
    required: false,
    example: 10,
  })
  @IsOptional()
  yearsOfExperience?: number;

  @ApiProperty({
    description: 'Profile picture URL of the doctor',
    type: String,
    required: false,
    example: 'http://example.com/profile.jpg',
  })
  @IsOptional()
  @IsString()
  profilePic?: string;

  @ApiProperty({ description: 'The specialization of the doctor', type: String })
  @IsString()
  @IsNotEmpty()
  specialization: string; // Accepts specialization name as an object

  @ApiProperty({
    description: 'Array of locations where the doctor practices',
    type: [Object],
    example: [{ id: '123' }],
  })
  @IsArray()
  @IsNotEmpty()
  locations: { id: string }[]; // Array of location objects with ids to connect
}
