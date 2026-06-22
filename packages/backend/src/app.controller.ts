import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AppService, type AppInfo } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOkResponse({ description: 'Health-check для liveness/readiness probes.' })
  getHealth(): { status: 'ok'; uptimeSec: number } {
    return { status: 'ok', uptimeSec: Math.round(process.uptime()) };
  }

  @Get('info')
  @ApiOkResponse({ description: 'Інформація про застосунок.' })
  getInfo(): AppInfo {
    return this.appService.getInfo();
  }
}
