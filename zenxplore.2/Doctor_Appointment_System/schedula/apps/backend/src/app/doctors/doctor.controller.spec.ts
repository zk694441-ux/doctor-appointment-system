import { Test, TestingModule } from '@nestjs/testing';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';

describe('DoctorController', () => {
  let controller: DoctorController;
  let service: DoctorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DoctorController],
      providers: [DoctorService],
    }).compile();

    controller = module.get<DoctorController>(DoctorController);
    service = module.get<DoctorService>(DoctorService);
  });

  describe('getDoctor', () => {
    it('should return hello doctor message', () => {
      const result = controller.getDoctor();
      expect(result).toEqual({ message: 'Hello Doctor' });
    });
  });
}); 