import { Test, TestingModule } from '@nestjs/testing';
import { RespondController } from './respond.controller';

describe('RespondController', () => {
  let controller: RespondController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RespondController],
    }).compile();

    controller = module.get<RespondController>(RespondController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
