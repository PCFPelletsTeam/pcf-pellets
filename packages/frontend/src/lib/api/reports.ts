import type { Paginated, Report, ReportFormat } from '@pcf/shared';
import api from '../http-client';

export interface ListReportsQuery {
  calculationId?: string;
  format?: ReportFormat;
  page?: number;
  pageSize?: number;
}

export interface GenerateReportBody {
  calculationId: string;
  format: ReportFormat;
  locale?: 'uk' | 'en';
}

export const reportsApi = {
  list: (query: ListReportsQuery = {}) =>
    api.get<Paginated<Report>>('/api/v1/reports', { params: query }).then((r) => r.data),
  get: (id: string) => api.get<Report>(`/api/v1/reports/${id}`).then((r) => r.data),
  generate: (body: GenerateReportBody) =>
    api.post<Report>('/api/v1/reports', body).then((r) => r.data),
  /** Повертає URL для прямого завантаження файлу через браузер. */
  fileUrl: (id: string) => `/api/v1/reports/${id}/file`,
};
