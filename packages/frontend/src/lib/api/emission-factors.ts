import type {
  ElectricitySource,
  EmissionFactor,
  GhgScope,
  MaterialCategory,
  Paginated,
} from '@pcf/shared';
import api from '../http-client';

export interface ListEFQuery {
  category?: MaterialCategory;
  scope?: GhgScope;
  electricitySource?: ElectricitySource;
  region?: string;
  year?: number;
  page?: number;
  pageSize?: number;
}

export const emissionFactorsApi = {
  list: (query: ListEFQuery = {}) =>
    api
      .get<Paginated<EmissionFactor>>('/api/v1/emission-factors', { params: query })
      .then((r) => r.data),
  getByKey: (key: string) =>
    api.get<EmissionFactor>(`/api/v1/emission-factors/key/${key}`).then((r) => r.data),
  get: (id: string) =>
    api.get<EmissionFactor>(`/api/v1/emission-factors/${id}`).then((r) => r.data),
};
