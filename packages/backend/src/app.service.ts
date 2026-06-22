import { Injectable } from '@nestjs/common';

export interface AppInfo {
  name: string;
  version: string;
  description: string;
  methodologyVersion: string;
  supportedStandards: string[];
}

@Injectable()
export class AppService {
  getInfo(): AppInfo {
    return {
      name: 'PCF Pellets API',
      version: '0.1.0',
      description:
        'API для розрахунку Product Carbon Footprint при виробництві залізорудних окатишів.',
      methodologyVersion: '0.1.0',
      supportedStandards: [
        'ISO 14067:2018',
        'GHG Protocol',
        'CBAM Reg. (EU) 2023/956',
        'Catena-X CX-0029',
      ],
    };
  }
}
