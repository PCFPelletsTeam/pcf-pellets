import type {
  CalculationMode,
  Paginated,
  PCFCalculation,
  PCFCalculationInput,
} from '@pcf/shared';
import api from '../http-client';

export interface ListCalculationsQuery {
  mode?: CalculationMode;
  facilityName?: string;
  periodFrom?: string;
  periodTo?: string;
  page?: number;
  pageSize?: number;
}

export const calculationsApi = {
  list: (query: ListCalculationsQuery = {}) =>
    api
      .get<Paginated<PCFCalculation>>('/api/v1/calculations', { params: query })
      .then((r) => r.data),
  get: (id: string) =>
    api.get<PCFCalculation>(`/api/v1/calculations/${id}`).then((r) => r.data),
  create: (body: PCFCalculationInput) =>
    api.post<PCFCalculation>('/api/v1/calculations', body).then((r) => r.data),
  remove: (id: string) =>
    api.delete<void>(`/api/v1/calculations/${id}`).then((r) => r.data),
};
