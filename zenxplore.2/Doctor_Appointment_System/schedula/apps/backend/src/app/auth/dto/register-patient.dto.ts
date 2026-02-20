import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class RegisterPatientDto {
  @ApiProperty({ description: 'The email of the patient' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'The password for the patient account' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: 'Full name of the patient' })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ description: 'Phone number of the patient' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}
