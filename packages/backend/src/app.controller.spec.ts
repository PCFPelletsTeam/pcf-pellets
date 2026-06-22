import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();
    appController = moduleRef.get<AppController>(AppController);
  });

  describe('health', () => {
    it('повертає status: ok', () => {
      const result = appController.getHealth();
      expect(result.status).toBe('ok');
      expect(typeof result.uptimeSec).toBe('number');
    });
  });

  describe('info', () => {
    it('повертає підтримувані стандарти', () => {
      const info = appController.getInfo();
      expect(info.name).toBe('PCF Pellets API');
      expect(info.supportedStandards).toContain('ISO 14067:2018');
      expect(info.supportedStandards).toContain('CBAM Reg. (EU) 2023/956');
    });
  });
});
