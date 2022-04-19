import { Test, TestingModule } from '@nestjs/testing';
import { AbilityController } from './ability.controller';

describe('AbilityController', () => {
  let controller: AbilityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AbilityController],
    }).compile();

    controller = module.get<AbilityController>(AbilityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
