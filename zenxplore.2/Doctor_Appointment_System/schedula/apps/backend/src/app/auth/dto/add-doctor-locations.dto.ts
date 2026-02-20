import { ApiProperty } from '@nestjs/swagger';

export class AddDoctorLocationsDto {
  @ApiProperty({ description: 'ID of the doctor', type: String })
  doctorId: string;

  @ApiProperty({
    description: 'List of locations where the doctor practices',
    type: [Object], // Array of location objects
    example: [
      {
        name: 'Clinic A',
        address: '123 Main St',
        city: 'City',
        state: 'State',
        country: 'Country',
        postalCode: '123456',
      },
    ],
  })
  locations: {
    name: string;
    address: string; 
    city: string; 
    state: string; 
    country: string;
    postalCode: string;
  }[];

}
        