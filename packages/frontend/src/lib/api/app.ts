import api from '../http-client';

export interface AppInfo {
  name: string;
  version: string;
  description: string;
  methodologyVersion: string;
  supportedStandards: string[];
}

export interface HealthStatus {
  status: 'ok';
  uptimeSec: number;
}

export const appApi = {
  health: () => api.get<HealthStatus>('/api/v1/health').then((r) => r.data),
  info: () => api.get<AppInfo>('/api/v1/info').then((r) => r.data),
};
